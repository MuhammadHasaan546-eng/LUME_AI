import { useState, useEffect, useRef, useCallback } from "react";
import { WebContainer, configureAPIKey } from "@webcontainer/api";
import {
  generateProject,
  generatePageDataFile,
} from "../editor/projectGenerator";

/**
 * safeDecode
 * ----------
 * Normalizes any value coming back from a WebContainer stream chunk or
 * `fs.readFile` call before handing it to `TextDecoder.decode()`.
 *
 * The WebContainer `spawn().output` ReadableStream and `fs.readFile` can
 * yield values in several shapes depending on the runtime version and the
 * encoding argument:
 *   - `Uint8Array` (the common case)            → decode directly
 *   - `ArrayBuffer`                             → decode directly
 *   - `DataView` / other `ArrayBufferView`      → decode directly
 *   - `string` (when an encoding was requested) → return as-is
 *   - `null` / `undefined`                       → return ""
 *   - anything else                             → log + return ""
 *
 * Without this guard, a non-ArrayBuffer/TypedArray value (e.g. a `string`
 * or `null`) reaches `TextDecoder.decode()` and throws:
 *   "Failed to execute 'decode' on 'TextDecoder': parameter 1 is not of
 *    type 'ArrayBuffer'."
 * That exception aborts the entire `npm install` stream reader loop, which
 * is the actual root cause of the "npm install failed with exit code 1"
 * boot error — NOT a peer-dependency (ERESOLVE) conflict.
 *
 * @param {TextDecoder} decoder
 * @param {*} chunk - raw value from the stream / fs API
 * @param {object} [options] - forwarded to decoder.decode (e.g. {stream:true})
 * @returns {string} safely-decoded text (never throws)
 */
function safeDecode(decoder, chunk, options) {
  // null / undefined → empty string
  if (chunk === null || chunk === undefined) return "";

  // Already a string (e.g. fs.readFile with "utf-8" encoding) → short-circuit
  if (typeof chunk === "string") return chunk;

  // ArrayBuffer → valid input for TextDecoder
  if (chunk instanceof ArrayBuffer) {
    try {
      return decoder.decode(chunk, options);
    } catch (err) {
      console.warn(
        "[useWebContainer] safeDecode: ArrayBuffer decode failed:",
        err,
      );
      return "";
    }
  }

  // Any ArrayBufferView: Uint8Array, Int8Array, Uint8ClampedArray,
  // DataView, etc. — all valid TextDecoder inputs.
  if (ArrayBuffer.isView(chunk)) {
    try {
      return decoder.decode(chunk, options);
    } catch (err) {
      console.warn(
        "[useWebContainer] safeDecode: TypedArray decode failed:",
        err,
      );
      return "";
    }
  }

  // Array-like with a .byteOffset/.buffer (some polyfills) — try the buffer
  if (
    chunk &&
    typeof chunk === "object" &&
    chunk.buffer instanceof ArrayBuffer
  ) {
    try {
      return decoder.decode(chunk.buffer, options);
    } catch (err) {
      console.warn("[useWebContainer] safeDecode: .buffer decode failed:", err);
      return "";
    }
  }

  // Unexpected shape — never throw, just log and return empty
  console.warn(
    "[useWebContainer] safeDecode: unrecognised chunk type:",
    Object.prototype.toString.call(chunk),
  );
  return "";
}

/**
 * useWebContainer
 * ---------------
 * Boots a WebContainer, mounts a REAL multi-file Vite project (generated
 * from the pageData JSON Single Source of Truth), runs `npm install` +
 * `npm run dev`, and exposes the live preview URL.
 *
 * This replaces the old minimal static-file server approach. The generated
 * project uses real ES modules + a real Vite dev server + Tailwind build
 * plugin, which is what eliminates all three runtime errors:
 *   - "import outside a module"  → real <script type="module"> via Vite
 *   - lucide-react forwardRef     → npm-installed ESM, React always in scope
 *   - Tailwind CDN warnings       → @tailwindcss/vite build plugin, no CDN
 *
 * On recoverable failures (missing API key, no cross-origin isolation), the
 * hook degrades gracefully to a sandbox fallback so the editor never
 * white-screens.
 */
export default function useWebContainer() {
  const [status, setStatus] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [fallback, setFallback] = useState(false);
  const [fileTree, setFileTree] = useState([]);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isCommandRunning, setIsCommandRunning] = useState(false);

  const containerRef = useRef(null);
  const bootPromiseRef = useRef(null);
  const serverProcessRef = useRef(null);
  const fallbackReportedRef = useRef(false);
  const installedRef = useRef(false);

  /**
   * Detect whether a boot failure is a "soft" configuration error that we
   * can recover from by falling back to the in-app Canvas preview.
   */
  const isRecoverableBootError = (err) => {
    const msg = (err?.message || err?.toString() || "").toLowerCase();
    return (
      msg.includes("referrer") ||
      msg.includes("not available") ||
      msg.includes("api key") ||
      msg.includes("apikey") ||
      msg.includes("configuration") ||
      msg.includes("cross-origin") ||
      msg.includes("crossoriginisolated") ||
      msg.includes("sharedarraybuffer") ||
      msg.includes("permission") ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed to fetch") ||
      msg.includes("datacloneerror")
    );
  };

  /**
   * Switch the hook into sandbox fallback mode. The editor will render the
   * preview via the in-app Canvas component instead of a live WebContainer URL.
   */
  const enableSandboxFallback = useCallback((reason) => {
    setFallback(true);
    setPreviewUrl(null);
    setError(null);
    setStatus("sandbox");
    if (!fallbackReportedRef.current) {
      fallbackReportedRef.current = true;
      console.warn(
        "[useWebContainer] Live runtime unavailable — using in-app Canvas preview.",
        reason ? `Reason: ${reason}` : "",
      );
    }
  }, []);

  /**
   * Append lines to the terminal output buffer.
   */
  const appendTerminal = useCallback((lines) => {
    setTerminalLines((prev) => {
      const newLines = Array.isArray(lines) ? lines : [lines];
      const combined = [...prev, ...newLines];
      return combined.slice(-500);
    });
  }, []);

  /**
   * Read the container file system recursively and build a tree structure
   * for the editor sidebar. Skips node_modules.
   */
  const readFileTree = useCallback(async (path = ".") => {
    const container = containerRef.current;
    if (!container) return [];

    try {
      const entries = await container.fs.readdir(path, {
        withFileTypes: true,
      });
      const tree = [];

      for (const entry of entries) {
        if (entry.name === "node_modules") continue;

        const fullPath = path === "." ? entry.name : `${path}/${entry.name}`;
        const isDir =
          typeof entry.isDirectory === "function"
            ? entry.isDirectory()
            : !entry.name.includes(".");

        const node = {
          name: entry.name,
          path: fullPath,
          type: isDir ? "directory" : "file",
        };

        if (isDir) {
          node.children = await readFileTree(fullPath);
        }

        tree.push(node);
      }

      tree.sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return tree;
    } catch (err) {
      console.error("[useWebContainer] readFileTree error:", err);
      return [];
    }
  }, []);

  const refreshFileTree = useCallback(async () => {
    if (!containerRef.current || fallback) return;
    const tree = await readFileTree(".");
    setFileTree(tree);
  }, [readFileTree, fallback]);

  /**
   * Read a single file's contents from the WebContainer file system.
   * Used by the FileExplorer to display source code in the code viewer and
   * by the boot routine to verify generated files (.npmrc, package.json).
   *
   * `container.fs.readFile` may return a `string` (when an encoding is
   * supplied) or a `Uint8Array` (when no encoding is supplied). We normalize
   * both through `safeDecode` so a raw byte buffer is never handed to code
   * that expects a string.
   *
   * @param {string} path - absolute or relative path (e.g. "src/App.jsx")
   * @returns {Promise<string|null>} file contents or null on error
   */
  const readFile = useCallback(
    async (path) => {
      const container = containerRef.current;
      if (!container || fallback) return null;
      try {
        // Request utf-8 string first; some runtimes honour the encoding arg
        // and return a string directly. If they ignore it and return bytes,
        // safeDecode still handles the Uint8Array correctly.
        const data = await container.fs.readFile(path, "utf-8");
        // safeDecode short-circuits strings and decodes Uint8Array buffers.
        return safeDecode(new TextDecoder(), data);
      } catch (err) {
        console.error("[useWebContainer] readFile error:", err);
        return null;
      }
    },
    [fallback],
  );

  /**
   * Write contents to a file in the WebContainer file system.
   * Allows the code viewer pane to persist edits back to the container.
   *
   * @param {string} path - file path
   * @param {string} contents - new file contents
   * @returns {Promise<boolean>} true on success
   */
  const writeFile = useCallback(
    async (path, contents) => {
      const container = containerRef.current;
      if (!container || fallback) return false;
      try {
        await container.fs.writeFile(path, contents);
        await refreshFileTree();
        return true;
      } catch (err) {
        console.error("[useWebContainer] writeFile error:", err);
        return false;
      }
    },
    [fallback, refreshFileTree],
  );

  /**
   * Run a terminal command inside the WebContainer and stream its output.
   *
   * Output is decoded through `safeDecode` so a malformed stream chunk can
   * never throw a `TextDecoder` exception and abort the loop. The full
   * stdout/stderr text is captured into `outputBuffer` so callers (notably
   * the install routine) can surface a precise, human-readable error message
   * containing the tail of the output on failure.
   *
   * @param {string} command
   * @param {string[]} args
   * @param {object} [opts]
   * @param {boolean} [opts.silent] - when true, do not echo to the terminal UI
   * @returns {Promise<{exitCode:number, output:string}>}
   */
  const runCommand = useCallback(
    async (command, args = [], opts = {}) => {
      const { silent = false } = opts;
      const container = containerRef.current;

      if (!container || fallback) {
        if (!silent) {
          appendTerminal({
            type: "error",
            text: "WebContainer not available — running in sandbox mode.",
          });
        }
        return { exitCode: 1, output: "" };
      }

      const cmdString = `${command} ${args.join(" ")}`.trim();
      if (!silent) appendTerminal({ type: "command", text: `$ ${cmdString}` });
      setIsCommandRunning(true);

      let outputBuffer = "";

      try {
        const process = await container.spawn(command, args);

        const reader = process.output.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          let result;
          try {
            result = await reader.read();
          } catch (readErr) {
            // A reader.read() rejection must never abort the whole command.
            console.warn(
              "[useWebContainer] runCommand: reader.read() rejected:",
              readErr,
            );
            break;
          }
          done = result.done;

          if (result.value !== null && result.value !== undefined) {
            // safeDecode normalizes Uint8Array / ArrayBuffer / string / null
            // so a TextDecoder crash can never happen here.
            const text = safeDecode(decoder, result.value, { stream: !done });
            if (text) {
              outputBuffer += text;
              if (!silent) appendTerminal({ type: "output", text });
            }
          }
        }

        // Final flush of the streaming decoder.
        try {
          const tail = decoder.decode();
          if (tail) {
            outputBuffer += tail;
            if (!silent) appendTerminal({ type: "output", text: tail });
          }
        } catch {
          /* noop */
        }

        let exitCode;
        try {
          exitCode = await process.exit;
        } catch (exitErr) {
          console.warn(
            "[useWebContainer] runCommand: process.exit rejected:",
            exitErr,
          );
          exitCode = 1;
        }

        if (!silent) {
          appendTerminal({
            type: exitCode === 0 ? "success" : "error",
            text: `[process exited with code ${exitCode}]`,
          });
        }
        return { exitCode, output: outputBuffer };
      } catch (err) {
        // Swallow TextDecoder / spawn errors — log and treat as a recoverable
        // failure (exit 1) rather than rethrowing and aborting the boot.
        console.error("[useWebContainer] runCommand error:", err);
        if (!silent) {
          appendTerminal({
            type: "error",
            text: err?.message || "Command execution failed.",
          });
        }
        return { exitCode: 1, output: outputBuffer };
      } finally {
        setIsCommandRunning(false);
        await refreshFileTree();
      }
    },
    [fallback, appendTerminal, refreshFileTree],
  );

  const clearTerminal = useCallback(() => {
    setTerminalLines([]);
  }, []);

  /**
   * Verify that the generated project files were mounted correctly by
   * reading them back through `readFile`. This confirms the `.npmrc` (with
   * `legacy-peer-deps=true`) and `package.json` are present and correct
   * before `npm install` is invoked, so a missing file is caught early with
   * a precise message instead of a cryptic npm failure.
   *
   * @returns {Promise<{ok:boolean, problems:string[]}>}
   */
  const verifyProjectFiles = useCallback(async () => {
    const problems = [];

    const npmrc = await readFile(".npmrc");
    if (npmrc === null) {
      problems.push(".npmrc is missing from the WebContainer mount.");
    } else if (!npmrc.includes("legacy-peer-deps=true")) {
      problems.push(
        ".npmrc is present but does not contain 'legacy-peer-deps=true'.",
      );
    }

    const pkg = await readFile("package.json");
    if (pkg === null) {
      problems.push("package.json is missing from the WebContainer mount.");
    } else {
      try {
        const parsed = JSON.parse(pkg);
        if (!parsed.dependencies || !parsed.dependencies.react) {
          problems.push("package.json is missing the 'react' dependency.");
        }
        if (!parsed.devDependencies || !parsed.devDependencies.vite) {
          problems.push("package.json is missing the 'vite' devDependency.");
        }
      } catch {
        problems.push("package.json is not valid JSON.");
      }
    }

    return { ok: problems.length === 0, problems };
  }, [readFile]);

  /**
   * Run `npm install` with a resilient retry loop.
   *
   *   1. Verify the generated `.npmrc` + `package.json` are present.
   *   2. Run `npm install` (the `.npmrc` already sets legacy-peer-deps).
   *   3. On failure, retry once with `npm install --legacy-peer-deps`.
   *   4. TextDecoder errors are swallowed (never rethrown) and treated as a
   *      recoverable retry trigger.
   *   5. On final failure, throw a precise, human-readable error containing
   *      the captured tail of stdout/stderr, the exit code, and the command.
   *
   * @returns {Promise<void>}
   */
  const installDependencies = useCallback(async () => {
    setStatus("installing");

    // (1) Verify generated files before installing.
    const verification = await verifyProjectFiles();
    if (!verification.ok) {
      appendTerminal({
        type: "error",
        text: `Project file verification failed:\n${verification.problems.join("\n")}`,
      });
      // Don't abort — npm will produce its own error, but we've logged the
      // root cause clearly.
    } else {
      appendTerminal({
        type: "success",
        text: "✓ Verified .npmrc (legacy-peer-deps=true) + package.json.",
      });
    }

    // (2) First attempt — relies on the mounted .npmrc.
    appendTerminal({ type: "command", text: "$ npm install" });
    let result = await runCommand("npm", ["install"]);
    let installCode = result.exitCode;

    // (3) Retry with explicit --legacy-peer-deps on failure.
    if (installCode !== 0) {
      appendTerminal({
        type: "error",
        text: "npm install failed — retrying with --legacy-peer-deps...",
      });
      appendTerminal({
        type: "command",
        text: "$ npm install --legacy-peer-deps",
      });
      result = await runCommand("npm", ["install", "--legacy-peer-deps"]);
      installCode = result.exitCode;
    }

    // (5) Precise error on final failure.
    if (installCode !== 0) {
      // Capture the tail of the output for the error message.
      const tail = (result.output || "")
        .trim()
        .split("\n")
        .slice(-15)
        .join("\n");
      throw new Error(
        `npm install failed with exit code ${installCode}.\n` +
          `Command: npm install${installCode !== 0 ? " --legacy-peer-deps (retry)" : ""}\n` +
          (tail ? `Output (last 15 lines):\n${tail}` : "No output captured."),
      );
    }

    installedRef.current = true;
    appendTerminal({
      type: "success",
      text: "✓ Dependencies installed.",
    });
  }, [runCommand, verifyProjectFiles, appendTerminal]);

  /**
   * Boot + mount the WebContainer with a REAL multi-file Vite project
   * generated from the pageData JSON. Idempotent: reuses an existing
   * instance. On recoverable failures, degrades to sandbox mode.
   *
   * @param {object} pageData - the PageData Single Source of Truth
   * @returns {Promise<string|null>} preview URL or null on fallback
   */
  const boot = useCallback(
    async (pageData) => {
      if (bootPromiseRef.current) {
        return bootPromiseRef.current;
      }

      bootPromiseRef.current = (async () => {
        try {
          setStatus("booting");
          setError(null);

          const apiKey = import.meta.env.VITE_WEBCONTAINER_API_KEY;

          if (!apiKey || apiKey === "your_webcontainer_api_key_here") {
            enableSandboxFallback(
              "Missing or placeholder VITE_WEBCONTAINER_API_KEY",
            );
            return null;
          }

          // WebContainer requires cross-origin isolation for SharedArrayBuffer.
          if (typeof window !== "undefined" && !window.crossOriginIsolated) {
            enableSandboxFallback(
              "Page is not cross-origin isolated (SharedArrayBuffer unavailable). " +
                "COOP/COEP headers are required — check vite.config.js.",
            );
            return null;
          }

          configureAPIKey(apiKey);
          const container = await WebContainer.boot();
          containerRef.current = container;

          setStatus("mounting");

          // Generate the full multi-file Vite project from pageData.
          const { tree } = generateProject(pageData);
          await container.mount(tree);

          await refreshFileTree();

          appendTerminal([
            { type: "success", text: "✓ WebContainer booted successfully." },
            {
              type: "output",
              text: "Mounted multi-file Vite project (ES modules + Tailwind build).",
            },
          ]);

          // Install dependencies (only once per container lifetime) using
          // the resilient retry loop. TextDecoder errors are swallowed
          // inside runCommand and never reach this catch.
          if (!installedRef.current) {
            await installDependencies();
          }

          // Start the Vite dev server.
          setStatus("starting");
          appendTerminal({ type: "command", text: "$ npm run dev" });
          const process = await container.spawn("npm", ["run", "dev"]);
          serverProcessRef.current = process;

          // Stream dev server output to the terminal using safeDecode so a
          // malformed chunk can never throw a TextDecoder exception.
          const reader = process.output.getReader();
          const decoder = new TextDecoder();

          while (true) {
            let result;
            try {
              result = await reader.read();
            } catch (readErr) {
              console.warn(
                "[useWebContainer] boot: dev-server reader.read() rejected:",
                readErr,
              );
              break;
            }
            if (result.done) break;
            if (result.value !== null && result.value !== undefined) {
              const text = safeDecode(decoder, result.value, { stream: true });
              if (text) appendTerminal({ type: "output", text });
            }
          }

          container.on("server-ready", (_port, url) => {
            setPreviewUrl(url);
            setStatus("running");
            appendTerminal({
              type: "success",
              text: `✓ Vite dev server ready at ${url}`,
            });
          });

          process.exit.then((code) => {
            if (code !== 0 && status !== "running") {
              setError(`Dev server exited with code ${code}`);
              setStatus("error");
            }
          });

          return previewUrl;
        } catch (err) {
          console.error("WebContainer boot error:", err);

          if (isRecoverableBootError(err)) {
            enableSandboxFallback(err?.message || "Boot failed");
            return null;
          }

          setError(err?.message || "Failed to start WebContainer");
          setStatus("error");
          bootPromiseRef.current = null;
          return null;
        }
      })();

      return bootPromiseRef.current;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enableSandboxFallback,
      refreshFileTree,
      installDependencies,
      status,
      previewUrl,
    ],
  );

  /**
   * Hot-update the preview by rewriting only src/data/pageData.json.
   * Vite's HMR picks up the change and re-renders without a full reload,
   * so the user sees edits instantly without re-running npm install.
   *
   * @param {object} pageData - updated PageData
   */
  const updatePreview = useCallback(
    async (pageData) => {
      if (fallback) return;

      const container = containerRef.current;

      if (!container) {
        await boot(pageData);
        return;
      }

      try {
        const json = generatePageDataFile(pageData);
        await container.fs.writeFile("/src/data/pageData.json", json);

        // Bust the iframe cache so the new content is fetched.
        setPreviewUrl((prev) =>
          prev ? `${prev.split("?")[0]}?t=${Date.now()}` : prev,
        );
      } catch (err) {
        console.error("WebContainer update error:", err);
        if (isRecoverableBootError(err)) {
          enableSandboxFallback(err?.message || "Update failed");
        } else {
          setError(err?.message || "Failed to update preview");
        }
      }
    },
    [boot, fallback, enableSandboxFallback],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      try {
        serverProcessRef.current?.kill?.();
        containerRef.current?.teardown?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  return {
    status,
    previewUrl,
    error,
    fallback,
    boot,
    updatePreview,
    fileTree,
    refreshFileTree,
    readFile,
    writeFile,
    verifyProjectFiles,
    terminalLines,
    runCommand,
    clearTerminal,
    isCommandRunning,
  };
}
