/**
 * ============================================================================
 * Default Project Files — bundled sample Vite + React + Tailwind project
 * ============================================================================
 *
 * Provides a realistic, always-available file tree + source contents so the
 * CodeEditor interface is fully functional even when the WebContainer
 * runtime is unavailable (sandbox mode, missing API key, no cross-origin
 * isolation, or still booting).
 *
 * The tree shape mirrors the nodes returned by `useWebContainer.readFileTree`
 * so the same <TreeNode /> renderer can consume either source:
 *
 *   node = { name, path, type: "directory" | "file", children?: node[] }
 *
 * `DEFAULT_FILE_CONTENTS` is a flat { path: string } map used to populate the
 * Monaco editor when a file is clicked and the WebContainer is not ready.
 * ============================================================================
 */

/* ── Source contents ─────────────────────────────────────────────────── */

const PACKAGE_JSON = `{
  "name": "lume-sample-project",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.2",
    "@vitejs/plugin-react": "^6.0.1",
    "tailwindcss": "^4.2.2",
    "vite": "^8.0.1"
  }
}
`;

const VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
});
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lume Sample Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const MAIN_JSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const APP_JSX = `import { useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Footer from "./components/Footer.jsx";

/**
 * Root application component.
 * Composes the page from reusable section components.
 */
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <main>
        <Hero onCount={() => setCount((c) => c + 1)} count={count} />
      </main>
      <Footer />
    </div>
  );
}
`;

const INDEX_CSS = `@import "tailwindcss";

:root {
  --brand: #4c7294;
}

body {
  margin: 0;
  font-family: "Inter", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.brand-gradient {
  background: linear-gradient(135deg, #4c7294 0%, #3d5d78 100%);
}
`;

const HEADER_JSX = `/**
 * Site header with navigation.
 */
export default function Header() {
  const links = ["Home", "Features", "Pricing", "Docs"];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="text-lg font-bold tracking-tight">
          Lume<span className="text-[var(--brand)]">.</span>
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link}>
              <a
                href="#"
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
        <button className="brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white">
          Get Started
        </button>
      </nav>
    </header>
  );
}
`;

const HERO_JSX = `/**
 * Hero section with a call-to-action.
 *
 * @param {{ count: number, onCount: () => void }} props
 */
export default function Hero({ count, onCount }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      <span className="inline-block rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400">
        ✨ Built with Lume
      </span>
      <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
        Build beautiful sites
        <br />
        <span className="bg-gradient-to-r from-[var(--brand)] to-sky-400 bg-clip-text text-transparent">
          in your browser
        </span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
        A sample project generated by the Lume web builder. Edit any file in
        the explorer and watch it update live.
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          onClick={onCount}
          className="brand-gradient rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
          Clicked {count} times
        </button>
        <a
          href="#"
          className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          Learn more
        </a>
      </div>
    </section>
  );
}
`;

const FOOTER_JSX = `/**
 * Site footer.
 */
export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 sm:flex-row">
        <p>© {new Date().getFullYear()} Lume. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-300">Privacy</a>
          <a href="#" className="hover:text-zinc-300">Terms</a>
          <a href="#" className="hover:text-zinc-300">Contact</a>
        </div>
      </div>
    </footer>
  );
}
`;

const README_MD = `# Lume Sample Project

A minimal **Vite + React + Tailwind** project generated by the Lume web builder.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

The dev server starts on http://localhost:5173.

## Project structure

\`\`\`
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Root component
    ├── index.css         # Tailwind + global styles
    └── components/
        ├── Header.jsx
        ├── Hero.jsx
        └── Footer.jsx
\`\`\`

## Editing

Click any file in the explorer sidebar to view and edit its source code.
Press **Ctrl/Cmd + S** to save your changes.
`;

const GITIGNORE = `# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules
dist
dist-ssr

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Env
.env
.env.local
`;

const NPMRC = `legacy-peer-deps=true
`;

/* ── Flat contents map ───────────────────────────────────────────────── */

export const DEFAULT_FILE_CONTENTS = {
  "package.json": PACKAGE_JSON,
  "vite.config.js": VITE_CONFIG,
  "index.html": INDEX_HTML,
  ".gitignore": GITIGNORE,
  ".npmrc": NPMRC,
  "README.md": README_MD,
  "src/main.jsx": MAIN_JSX,
  "src/App.jsx": APP_JSX,
  "src/index.css": INDEX_CSS,
  "src/components/Header.jsx": HEADER_JSX,
  "src/components/Hero.jsx": HERO_JSX,
  "src/components/Footer.jsx": FOOTER_JSX,
};

/* ── Tree builder ────────────────────────────────────────────────────── */

/**
 * Build a tree of nodes (matching the WebContainer shape) from the flat
 * contents map. Directories are sorted before files; entries are sorted
 * alphabetically within each group.
 *
 * @returns {Array<{name:string,path:string,type:string,children?:Array}>}
 */
function buildTree(flat) {
  const root = { children: [] };
  const dirNodes = { "": root };

  const paths = Object.keys(flat).sort();

  for (const path of paths) {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];

    // Ensure every ancestor directory exists.
    let dirPath = "";
    let parent = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts[i];
      dirPath = dirPath ? `${dirPath}/${segment}` : segment;
      if (!dirNodes[dirPath]) {
        const dirNode = {
          name: segment,
          path: dirPath,
          type: "directory",
          children: [],
        };
        dirNodes[dirPath] = dirNode;
        parent.children.push(dirNode);
      }
      parent = dirNodes[dirPath];
    }

    parent.children.push({
      name: fileName,
      path,
      type: "file",
    });
  }

  // Recursively sort: directories first, then alphabetical.
  const sortNode = (node) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root.children;
}

export const DEFAULT_FILE_TREE = buildTree(DEFAULT_FILE_CONTENTS);
