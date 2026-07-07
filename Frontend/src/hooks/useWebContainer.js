import { useState, useEffect, useRef, useCallback } from "react";
import { WebContainer, configureAPIKey } from "@webcontainer/api";
import {
  generateProject,
  generatePageDataFile,
} from "../editor/projectGenerator";

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
   * Run a terminal command inside the WebContainer and stream its output.
   */
  const runCommand = useCallback(
    async (command, args = []) => {
      const container = containerRef.current;

      if (!container || fallback) {
        appendTerminal({
          type: "error",
          text: "WebContainer not available — running in sandbox mode.",
        });
        return;
      }

      const cmdString = `${command} ${args.join(" ")}`.trim();
      appendTerminal({ type: "command", text: `$ ${cmdString}` });
      setIsCommandRunning(true);

      try {
        const process = await container.spawn(command, args);

        const reader = process.output.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
           
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            const text = decoder.decode(result.value, { stream: !done });
            if (text) {
              appendTerminal({ type: "output", text });
            }
          }
        }

         
        const exitCode = await process.exit;
        appendTerminal({
          type: exitCode === 0 ? "success" : "error",
          text: `[process exited with code ${exitCode}]`,
        });
        return exitCode;
      } catch (err) {
        appendTerminal({
          type: "error",
          text: err?.message || "Command execution failed.",
        });
        return 1;
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

          // Install dependencies (only once per container lifetime).
          if (!installedRef.current) {
            setStatus("installing");
            appendTerminal({ type: "command", text: "$ npm install" });
            const installCode = await runCommand("npm", ["install"]);
            if (installCode !== 0) {
              throw new Error(
                `npm install failed with exit code ${installCode}`,
              );
            }
            installedRef.current = true;
            appendTerminal({
              type: "success",
              text: "✓ Dependencies installed.",
            });
          }

          // Start the Vite dev server.
          setStatus("starting");
          appendTerminal({ type: "command", text: "$ npm run dev" });
          const process = await container.spawn("npm", ["run", "dev"]);
          serverProcessRef.current = process;

          // Stream dev server output to the terminal.
          const reader = process.output.getReader();
          const decoder = new TextDecoder();
           
          while (true) {
             
            const result = await reader.read();
            if (result.done) break;
            if (result.value) {
              const text = decoder.decode(result.value, { stream: true });
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
    [enableSandboxFallback, refreshFileTree, runCommand, status, previewUrl],
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
    terminalLines,
    runCommand,
    clearTerminal,
    isCommandRunning,
  };
}
