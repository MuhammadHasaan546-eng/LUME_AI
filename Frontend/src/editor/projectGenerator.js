/**
 * ============================================================================
 * Lume Multi-File Vite Project Generator
 * ============================================================================
 *
 * Replaces the old single-file in-browser Babel compilation (which caused all
 * three runtime errors) with a REAL multi-file Vite project generated from
 * the pageData JSON Single Source of Truth.
 *
 * What this fixes
 * ---------------
 *  1. "Cannot use import statement outside a module"
 *     → The generated project uses a real Vite dev server with ES modules.
 *       Every file is a proper .jsx/.js module loaded via <script type="module">.
 *  2. "Cannot read properties of undefined reading 'forwardRef'"
 *     → lucide-react is installed via npm and imported as ESM, so React is
 *       always in scope. No more UMD global binding hack.
 *  3. Tailwind CDN production warnings
 *     → Tailwind is a real build dependency (@tailwindcss/vite), not a CDN
 *       <script>. No runtime warnings, proper purging.
 *
 * Output
 * ------
 * `generateProject(pageData)` returns a WebContainer-compatible mount tree:
 *   {
 *     'package.json': { file: { contents } },
 *     'vite.config.js': { file: { contents } },
 *     'index.html':    { file: { contents } },
 *     src: { directory: { ... } }
 *   }
 *
 * The tree is consumed by `useWebContainer.mount(tree)`.
 * ============================================================================
 */
import { normalizePageData, serializePageData } from "./schema/pageData";

/* ------------------------------------------------------------------ helpers */

/**
 * Escape backticks and ${} in a string so it can be embedded inside a JS
 * template literal safely.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeTemplateLiteral(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

/**
 * Build a WebContainer file node.
 * @param {string} contents
 * @returns {{file:{contents:string}}}
 */
const file = (contents) => ({ file: { contents } });

/**
 * Build a WebContainer directory node from a flat { path: contents } map.
 * Nested paths (e.g. "src/main.jsx") are split into directory levels.
 *
 * @param {Record<string,string>} flat
 * @returns {object} WebContainer mount tree
 */
function buildTree(flat) {
  const root = {};
  for (const [path, contents] of Object.entries(flat)) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      if (isLeaf) {
        node[part] = file(contents);
      } else {
        node[part] = node[part] || { directory: {} };
        if (!node[part].directory) {
          node[part] = { directory: {} };
        }
        node = node[part].directory;
      }
    }
  }
  return root;
}

/* ----------------------------------------------------------- file templates */

/**
 * Generate package.json for the preview project.
 * Pinned to known-good versions that work inside WebContainer.
 *
 * @returns {string}
 */
function generatePackageJson() {
  return JSON.stringify(
    {
      name: "lume-preview",
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite --host --port 5173",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "lucide-react": "^0.453.0",
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.3.1",
        "@tailwindcss/vite": "^4.0.0",
        tailwindcss: "^4.0.0",
        vite: "^5.4.2",
      },
    },
    null,
    2,
  );
}

/**
 * Generate vite.config.js for the preview project.
 * Uses @vitejs/plugin-react + @tailwindcss/vite (real build, no CDN).
 *
 * @returns {string}
 */
function generateViteConfig() {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Real Vite config — ES modules + Tailwind build plugin (no CDN).
// This is what eliminates the "import outside module" and Tailwind CDN errors.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
`;
}

/**
 * Generate index.html — the real module entry point.
 * Uses <script type="module"> so all imports resolve as ESM.
 *
 * @param {object} meta - page meta (title, lang, description)
 * @returns {string}
 */
function generateIndexHtml(meta = {}) {
  const title = escapeTemplateLiteral(meta.title || "Lume Preview");
  const lang = meta.lang || "en";
  const description = escapeTemplateLiteral(meta.description || "");
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- type="module" → real ES module loading (fixes import-outside-module) -->
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

/**
 * Generate src/main.jsx — React root mount.
 * @returns {string}
 */
function generateMainJsx() {
  return `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

/**
 * Generate src/index.css — Tailwind v4 import (real build, no CDN script).
 * @param {object} theme - page theme
 * @returns {string}
 */
function generateIndexCss(theme = {}) {
  const primary = theme.primary || "#4c7294";
  const radius = theme.radius || "0.75rem";
  return `@import "tailwindcss";

:root {
  --lume-primary: ${primary};
  --lume-radius: ${radius};
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: ${theme.font ? `'${theme.font}', ` : ""}ui-sans-serif, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;
}

/**
 * Generate the icon registry for the preview project.
 * Mirrors the app's icons.js — maps string names to lucide-react components
 * via named ESM imports (fixes the forwardRef error).
 * @returns {string}
 */
function generateIconsJs() {
  return `import {
  Sparkles, Layers, Rocket, Zap, Star, Shield, Globe, Heart,
  Check, ArrowRight, Mail, Phone, Users, Code, Palette, Gauge,
  Lock, MessageSquare,
} from "lucide-react";

const REGISTRY = {
  sparkles: Sparkles, layers: Layers, rocket: Rocket, zap: Zap,
  star: Star, shield: Shield, globe: Globe, heart: Heart,
  check: Check, arrow: ArrowRight, mail: Mail, phone: Phone,
  users: Users, code: Code, palette: Palette, gauge: Gauge,
  lock: Lock, message: MessageSquare,
};

export function getIcon(name) {
  return REGISTRY[name] || Sparkles;
}
`;
}

/**
 * Generate the section components file for the preview project.
 * This is a stringified version of SectionComponents.jsx — all components
 * use real ESM imports (react + lucide-react), so forwardRef is always
 * resolved correctly.
 * @returns {string}
 */
function generateSectionComponents() {
  return `import React, { memo } from "react";
import { ArrowRight, Check, Mail, Phone } from "lucide-react";
import { getIcon } from "./icons";

function HeaderBase({ id, brand, logoText, links = [], ctaLabel, ctaHref }) {
  return (
    <header id={id} className="sticky top-0 z-40 w-full border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
        <a href="#home" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-black text-white">{(logoText || brand || "L").charAt(0)}</span>
          <span>{brand || logoText}</span>
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">{link.label}</a>
            </li>
          ))}
        </ul>
        {ctaLabel ? (
          <a href={ctaHref || "#"} className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-white dark:text-zinc-900">
            {ctaLabel}<ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </nav>
    </header>
  );
}
export const Header = memo(HeaderBase);

function HeroBase({ id, eyebrow, title, subtitle, primaryCta, secondaryCta, image }) {
  return (
    <section id={id} className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white py-20 dark:from-zinc-950 dark:to-zinc-900 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{eyebrow}
            </span>
          ) : null}
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">{title}</h1>
          {subtitle ? <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">{subtitle}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            {primaryCta?.label ? (
              <a href={primaryCta.href || "#"} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90">
                {primaryCta.label}<ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
            {secondaryCta?.label ? (
              <a href={secondaryCta.href || "#"} className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
        {image?.src ? (
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-xl dark:border-zinc-800">
              <img src={image.src} alt={image.alt || ""} loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
export const Hero = memo(HeroBase);

function FeaturesBase({ id, eyebrow, title, subtitle, columns = 3, items = [] }) {
  const colClass = columns >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{title}</h2> : null}
          {subtitle ? <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">{subtitle}</p> : null}
        </div>
        <div className={\`mt-12 grid gap-6 \${colClass}\`}>
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <article key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-purple-500"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">{item.title}</h3>
                {item.description ? <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.description}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export const Features = memo(FeaturesBase);

function StatsBase({ id, title, items = [] }) {
  return (
    <section id={id} className="bg-zinc-50 py-16 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {title ? <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">{title}</h2> : null}
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((stat) => (
            <div key={stat.id} className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">{stat.value}</span>
                <span className="mt-1 block text-sm font-medium text-zinc-600 dark:text-zinc-300">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
export const Stats = memo(StatsBase);

function GalleryBase({ id, eyebrow, title, columns = 3, items = [] }) {
  const colClass = columns >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{title}</h2> : null}
        </div>
        <div className={\`mt-12 grid gap-4 \${colClass}\`}>
          {items.map((item) => (
            <figure key={item.id} className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <img src={item.src} alt={item.alt || ""} loading="lazy" className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
              {item.caption ? <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-semibold text-white">{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
export const Gallery = memo(GalleryBase);

function TestimonialsBase({ id, eyebrow, title, items = [] }) {
  return (
    <section id={id} className="bg-zinc-50 py-20 dark:bg-zinc-900 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{title}</h2> : null}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <figure key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <blockquote className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">&ldquo;{item.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {item.avatar ? <img src={item.avatar} alt={item.author || ""} loading="lazy" className="h-10 w-10 rounded-full object-cover" /> : null}
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">{item.author}</div>
                  {item.role ? <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.role}</div> : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
export const Testimonials = memo(TestimonialsBase);

function PricingBase({ id, eyebrow, title, plans = [] }) {
  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{title}</h2> : null}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className={\`relative flex flex-col rounded-2xl border p-6 transition \${plan.highlighted ? "border-purple-500 bg-gradient-to-b from-purple-500/5 to-transparent shadow-lg" : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50"}\`}>
              {plan.highlighted ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Popular</span> : null}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
              {plan.description ? <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p> : null}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">{plan.price}</span>
                {plan.period ? <span className="text-sm text-zinc-500 dark:text-zinc-400">{plan.period}</span> : null}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.ctaLabel ? (
                <a href={plan.ctaHref || "#"} className={\`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition \${plan.highlighted ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90" : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"}\`}>
                  {plan.ctaLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export const Pricing = memo(PricingBase);

function CtaBase({ id, title, subtitle, primaryCta, secondaryCta }) {
  return (
    <section id={id} className="bg-zinc-50 py-20 dark:bg-zinc-900 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-6 py-16 text-center shadow-xl sm:px-12">
          {title ? <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2> : null}
          {subtitle ? <p className="mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">{subtitle}</p> : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primaryCta?.label ? (
              <a href={primaryCta.href || "#"} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow transition hover:bg-zinc-100">
                {primaryCta.label}<ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
            {secondaryCta?.label ? (
              <a href={secondaryCta.href || "#"} className="inline-flex items-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
export const Cta = memo(CtaBase);

function ContactBase({ id, eyebrow, title, subtitle, email, phone, fields = [], submitLabel }) {
  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{title}</h2> : null}
          {subtitle ? <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">{subtitle}</p> : null}
          <ul className="mt-8 space-y-3">
            {email ? <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200"><Mail className="h-5 w-5 text-purple-500" /><a href={\`mailto:\${email}\`} className="hover:underline">{email}</a></li> : null}
            {phone ? <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200"><Phone className="h-5 w-5 text-purple-500" /><a href={\`tel:\${phone}\`} className="hover:underline">{phone}</a></li> : null}
          </ul>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50" aria-label="Contact form">
          <div className="space-y-4">
            {fields.map((field) => {
              const isTextarea = field.type === "textarea";
              const sharedClass = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white";
              return (
                <div key={field.id}>
                  <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">{field.label}</label>
                  {isTextarea ? <textarea id={field.id} name={field.name} rows={4} className={sharedClass} /> : <input id={field.id} name={field.name} type={field.type || "text"} className={sharedClass} />}
                </div>
              );
            })}
          </div>
          {submitLabel ? (
            <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90">
              {submitLabel}<ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
}
export const Contact = memo(ContactBase);

function FooterBase({ id, brand, tagline, columns = [], socials = [], copyright }) {
  return (
    <footer id={id} className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-lg font-extrabold text-zinc-900 dark:text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-black text-white">{(brand || "L").charAt(0)}</span>
              {brand}
            </div>
            {tagline ? <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{tagline}</p> : null}
          </div>
          {columns.map((col) => (
            <div key={col.id}>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {(col.links || []).map((link) => (
                  <li key={link.id}><a href={link.href} className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row">
          {copyright ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{copyright}</p> : null}
          {socials.length ? (
            <ul className="flex items-center gap-3">
              {socials.map((social) => {
                const Icon = getIcon(social.icon);
                return (
                  <li key={social.id}>
                    <a href={social.href} aria-label={social.label} className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-purple-500 hover:text-purple-500 dark:border-zinc-800 dark:text-zinc-400">
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
export const Footer = memo(FooterBase);
`;
}

/**
 * Generate the section registry for the preview project.
 * Maps section type → component, mirroring the app's sectionRegistry.
 * @returns {string}
 */
function generateSectionRegistry() {
  return `import { Header, Hero, Features, Stats, Gallery, Testimonials, Pricing, Cta, Contact, Footer } from "./SectionComponents";

export const SECTION_REGISTRY = {
  hero: { component: Hero },
  features: { component: Features },
  cta: { component: Cta },
  stats: { component: Stats },
  gallery: { component: Gallery },
  testimonials: { component: Testimonials },
  pricing: { component: Pricing },
  contact: { component: Contact },
};

export const FIXED_REGISTRY = {
  header: { component: Header },
  footer: { component: Footer },
};
`;
}

/**
 * Generate src/App.jsx — the root component that reads the embedded
 * pageData.json and renders Header + sections + Footer.
 *
 * @param {object} pageData - normalized page data
 * @returns {string}
 */
function generateAppJsx(pageData) {
  const isDark = pageData.meta?.theme?.mode === "dark";
  const font = pageData.meta?.theme?.font;
  return `import React, { useMemo } from "react";
import pageData from "./data/pageData.json";
import { SECTION_REGISTRY, FIXED_REGISTRY } from "./sections/sectionRegistry";

export default function App() {
  const data = pageData;
  const HeaderComponent = FIXED_REGISTRY.header.component;
  const FooterComponent = FIXED_REGISTRY.footer.component;

  return (
    <div className="${isDark ? "dark" : ""}" style={{ fontFamily: ${font ? `'${font}', ` : ""}ui-sans-serif, system-ui, sans-serif }}>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {data.header ? <HeaderComponent {...data.header} /> : null}
        <main>
          {data.sections.map((section) => {
            const entry = SECTION_REGISTRY[section.type];
            if (!entry) return null;
            const Component = entry.component;
            return <Component key={section.id} {...section} />;
          })}
        </main>
        {data.footer ? <FooterComponent {...data.footer} /> : null}
      </div>
    </div>
  );
}
`;
}

/* ------------------------------------------------------------- public API */

/**
 * Generate a complete, mountable multi-file Vite project from a PageData
 * document. This is the function that replaces the old single-file
 * in-browser Babel compilation.
 *
 * @param {object} rawPageData - the PageData Single Source of Truth
 * @returns {{tree:object, packageJson:string}} WebContainer mount tree
 */
export function generateProject(rawPageData) {
  const pageData = normalizePageData(rawPageData);

  const flat = {
    "package.json": generatePackageJson(),
    "vite.config.js": generateViteConfig(),
    "index.html": generateIndexHtml(pageData.meta),
    "src/main.jsx": generateMainJsx(),
    "src/index.css": generateIndexCss(pageData.meta.theme),
    "src/App.jsx": generateAppJsx(pageData),
    "src/data/pageData.json": serializePageData(pageData),
    "src/sections/icons.js": generateIconsJs(),
    "src/sections/SectionComponents.jsx": generateSectionComponents(),
    "src/sections/sectionRegistry.js": generateSectionRegistry(),
  };

  return {
    tree: buildTree(flat),
    packageJson: flat["package.json"],
    pageData,
  };
}

/**
 * Generate ONLY the pageData.json file contents (used for hot-updating the
 * preview without re-mounting the whole project).
 *
 * @param {object} rawPageData
 * @returns {string}
 */
export function generatePageDataFile(rawPageData) {
  return serializePageData(normalizePageData(rawPageData));
}

export default generateProject;
