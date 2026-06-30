import { useState, useEffect, useRef, useCallback } from "react";
import { WebContainer, configureAPIKey } from "@webcontainer/api";

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
  const terminalEndRef = useRef(null);

  // Minimal static-file server (no external deps → instant boot).
  const serverJs = `import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = url.pathname;
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    const filePath = '.' + pathname;
    const body = await readFile(filePath);
    const mime = MIME[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(body);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + err.message);
  }
});

server.listen(3000, () => {
  console.log('Lume preview server listening on port 3000');
});
`;

  const packageJson = JSON.stringify(
    {
      name: "lume-preview",
      type: "module",
      scripts: { dev: "node server.js" },
    },
    null,
    2,
  );

  /**
   * Detect whether a boot failure is a "soft" configuration error that we
   * can recover from by falling back to the srcDoc sandbox preview.
   * These are typically referrer / API-key / cross-origin issues.
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
      msg.includes("permission") ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed to fetch")
    );
  };

  /**
   * Switch the hook into sandbox fallback mode. The editor will render the
   * preview via an iframe srcDoc instead of a live WebContainer URL.
   */
  const enableSandboxFallback = useCallback((reason) => {
    setFallback(true);
    setPreviewUrl(null);
    setError(null);
    setStatus("sandbox");
    if (!fallbackReportedRef.current) {
      fallbackReportedRef.current = true;
      console.warn(
        "[useWebContainer] Live runtime unavailable — using sandbox preview.",
        reason ? `Reason: ${reason}` : "",
      );
    }
  }, []);

  /**
   * Read the container file system recursively and build a tree structure
   * suitable for rendering in the editor sidebar.
   *
   * Each node: { name, path, type: "directory"|"file", children?: [] }
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
        // Skip node_modules to keep the tree fast and readable.
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

      // Sort: directories first, then files, alphabetically.
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

  /**
   * Re-read the container file system and update the fileTree state.
   */
  const refreshFileTree = useCallback(async () => {
    if (!containerRef.current || fallback) return;
    const tree = await readFileTree(".");
    setFileTree(tree);
  }, [readFileTree, fallback]);

  /**
   * Append lines to the terminal output buffer.
   */
  const appendTerminal = useCallback((lines) => {
    setTerminalLines((prev) => {
      const newLines = Array.isArray(lines) ? lines : [lines];
      // Cap the buffer to prevent unbounded growth.
      const combined = [...prev, ...newLines];
      return combined.slice(-500);
    });
  }, []);

  /**
   * Run a terminal command inside the WebContainer and stream its output
   * to the terminalLines buffer.
   *
   * @param {string} command  - e.g. "ls", "cat", "npm"
   * @param {string[]} args   - e.g. ["-la"], ["index.html"]
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

        // Stream stdout/stderr to the terminal buffer.
        const reader = process.output.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          // eslint-disable-next-line no-await-in-loop
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            const text = decoder.decode(result.value, { stream: !done });
            if (text) {
              appendTerminal({ type: "output", text });
            }
          }
        }

        // eslint-disable-next-line no-await-in-loop
        const exitCode = await process.exit;
        appendTerminal({
          type: exitCode === 0 ? "success" : "error",
          text: `[process exited with code ${exitCode}]`,
        });
      } catch (err) {
        appendTerminal({
          type: "error",
          text: err?.message || "Command execution failed.",
        });
      } finally {
        setIsCommandRunning(false);
        // Refresh the file tree in case the command changed the FS.
        await refreshFileTree();
      }
    },
    [fallback, appendTerminal, refreshFileTree],
  );

  /**
   * Clear the terminal output buffer.
   */
  const clearTerminal = useCallback(() => {
    setTerminalLines([]);
  }, []);

  /**
   * Boot + mount the WebContainer with the given initial HTML.
   * Idempotent: if already booted, reuses the existing instance.
   * On recoverable failures, degrades to sandbox mode instead of erroring.
   */
  const boot = useCallback(
    async (initialHtml) => {
      // If a boot is already in-flight, wait for it.
      if (bootPromiseRef.current) {
        return bootPromiseRef.current;
      }

      bootPromiseRef.current = (async () => {
        try {
          setStatus("booting");
          setError(null);

          const apiKey = import.meta.env.VITE_WEBCONTAINER_API_KEY;

          // Missing or placeholder key → degrade gracefully instead of
          // throwing a hard error that breaks the editor.
          if (!apiKey || apiKey === "your_webcontainer_api_key_here") {
            enableSandboxFallback(
              "Missing or placeholder VITE_WEBCONTAINER_API_KEY",
            );
            return null;
          }

          // Configure the API key (required for production usage),
          // then boot the WebContainer. The key must be set before boot.
          configureAPIKey(apiKey);
          const container = await WebContainer.boot();
          containerRef.current = container;

          setStatus("mounting");

          // Mount the minimal project tree.
          await container.mount({
            "package.json": { file: { contents: packageJson } },
            "server.js": { file: { contents: serverJs } },
            "index.html": { file: { contents: initialHtml || "" } },
          });

          // Read the initial file tree for the sidebar.
          await refreshFileTree();

          // Print a welcome banner to the terminal.
          appendTerminal([
            { type: "success", text: "✓ WebContainer booted successfully." },
            {
              type: "output",
              text: "Lume preview runtime ready. Type commands below (e.g. ls, cat index.html).",
            },
          ]);

          // Start the dev server.
          const process = await container.spawn("npm", ["run", "dev"]);
          serverProcessRef.current = process;

          // Listen for the server-ready event to get the preview URL.
          container.on("server-ready", (_port, url) => {
            setPreviewUrl(url);
            setStatus("running");
          });

          // Surface process errors.
          process.exit.then((code) => {
            if (code !== 0 && status !== "running") {
              setError(`Server process exited with code ${code}`);
              setStatus("error");
            }
          });
        } catch (err) {
          console.error("WebContainer boot error:", err);

          // Recoverable configuration / referrer errors → sandbox fallback.
          if (isRecoverableBootError(err)) {
            enableSandboxFallback(err?.message || "Boot failed");
            return null;
          }

          // Non-recoverable error → surface it.
          setError(err?.message || "Failed to start WebContainer");
          setStatus("error");
          bootPromiseRef.current = null;
        }
      })();

      return bootPromiseRef.current;
    },
    [
      packageJson,
      serverJs,
      status,
      enableSandboxFallback,
      refreshFileTree,
      appendTerminal,
    ],
  );

  const updatePreview = useCallback(
    async (html) => {
      if (fallback) return;

      const container = containerRef.current;

      if (!container) {
        await boot(html);
        return;
      }

      try {
        await container.fs.writeFile("index.html", html);

        setPreviewUrl((prev) =>
          prev ? `${prev.split("?")[0]}?t=${Date.now()}` : prev,
        );

        await refreshFileTree();
      } catch (err) {
        console.error("WebContainer update error:", err);
        // If the container died mid-flight, fall back to sandbox mode.
        if (isRecoverableBootError(err)) {
          enableSandboxFallback(err?.message || "Update failed");
        } else {
          setError(err?.message || "Failed to update preview");
        }
      }
    },
    [boot, fallback, enableSandboxFallback, refreshFileTree],
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
