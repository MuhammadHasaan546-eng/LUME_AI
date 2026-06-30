import React from "react";

/**
 * Default starter HTML template used by the Lume editor.
 *
 * This is the raw HTML string that is loaded into the Monaco editor and
 * rendered inside the sandboxed iframe preview when no generated code
 * exists yet. It ships a self-contained document (Tailwind via CDN) so the
 * live preview works out of the box.
 */
export const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lume Starter Template</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
      };
    </script>
    <style>
      body { font-family: "Inter", ui-sans-serif, system-ui, sans-serif; }
    </style>
  </head>
  <body class="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
    <main class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span class="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-zinc-400">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Lume Live Preview
      </span>
      <h1 class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
        Start Building Your Layout
      </h1>
      <p class="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        Edit this HTML in the source panel, or ask the Lume AI Copilot to
        refine the design for you. Changes sync to the canvas instantly.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
          Primary Action
        </button>
        <button class="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500">
          Secondary
        </button>
      </div>
    </main>
  </body>
</html>`;

/**
 * JSX React component equivalent of {@link defaultHtmlTemplate}.
 *
 * Useful when you want to render the starter layout directly inside the
 * React tree (e.g. as a placeholder before the WebContainer boots) instead
 * of injecting raw HTML into an iframe.
 */
export default function DefaultTemplate() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Lume Live Preview
      </span>
      <h1 className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
        Start Building Your Layout
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        Edit this HTML in the source panel, or ask the Lume AI Copilot to refine
        the design for you. Changes sync to the canvas instantly.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
          Primary Action
        </button>
        <button className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500">
          Secondary
        </button>
      </div>
    </main>
  );
}
