import { useState, useEffect, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

/**
 * useWebContainer
 * ---------------
 * Manages a StackBlitz WebContainer instance for live previewing
 * generated HTML/CSS/JS code inside an in-browser Node runtime.
 *
 * Responsibilities:
 *  - Boot the WebContainer once (using the Vite env API key).
 *  - Mount a minimal project tree (package.json + server + index.html).
 *  - Start a dev server and expose its URL.
 *  - Allow updating the `index.html` file on the fly without rebooting.
 *
 * Returns:
 *  - status:   "idle" | "booting" | "mounting" | "running" | "error"
 *  - previewUrl: string | null  (the URL to load in an <iframe>)
 *  - error:    string | null
 *  - updatePreview(code): writes new HTML to the container and refreshes.
 */
export default function useWebContainer() {
  const [status, setStatus] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const bootPromiseRef = useRef(null);
  const serverProcessRef = useRef(null);

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
   * Boot + mount the WebContainer with the given initial HTML.
   * Idempotent: if already booted, reuses the existing instance.
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
          if (!apiKey) {
            throw new Error(
              "Missing VITE_WEBCONTAINER_API_KEY. Add it to Frontend/.env",
            );
          }

          // Boot with the API key (required for production usage).
          const container = await WebContainer.boot({ apikey: apiKey });
          containerRef.current = container;

          setStatus("mounting");

          // Mount the minimal project tree.
          await container.mount({
            "package.json": { file: { contents: packageJson } },
            "server.js": { file: { contents: serverJs } },
            "index.html": { file: { contents: initialHtml || "" } },
          });

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
          setError(err?.message || "Failed to start WebContainer");
          setStatus("error");
          bootPromiseRef.current = null;
        }
      })();

      return bootPromiseRef.current;
    },
    [packageJson, serverJs, status],
  );

  /**
   * Update the preview by overwriting index.html and reloading the iframe.
   * If the container hasn't booted yet, it boots first.
   */
  const updatePreview = useCallback(
    async (html) => {
      const container = containerRef.current;

      if (!container) {
        await boot(html);
        return;
      }

      try {
        await container.fs.writeFile("index.html", html);
        // The static server reads the file on every request, so a simple
        // URL cache-bust forces the iframe to reload fresh content.
        setPreviewUrl((prev) =>
          prev ? `${prev.split("?")[0]}?t=${Date.now()}` : prev,
        );
      } catch (err) {
        console.error("WebContainer update error:", err);
        setError(err?.message || "Failed to update preview");
      }
    },
    [boot],
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

  return { status, previewUrl, error, boot, updatePreview };
}
