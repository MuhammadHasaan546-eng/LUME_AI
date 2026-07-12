/**
 * ============================================================================
 * Lume Page-Data Schema — Single Source of Truth
 * ============================================================================
 *
 * This module defines the canonical JSON structure that describes a Lume
 * website. It is the ONE structure persisted to MongoDB (via a single API
 * call) and consumed by every rendering surface:
 *
 *   1. The in-app Canvas/Preview (React components mapped from `sections`)
 *   2. The WebContainer live preview (a real multi-file Vite project
 *      generated from the same `sections` array)
 *   3. The deployed LiveSite view
 *
 * Design goals
 * ------------
 *  - FIXED vs DYNAMIC separation: `header` and `footer` are fixed singleton
 *    elements; `sections` is a dynamic, ordered array of body components
 *    (Hero, Features, CTA, …) that users can rearrange, add, or remove.
 *  - TYPE DISCIPLINE: every section carries a `type` from SECTION_TYPES.
 *    The section registry maps each type to a renderer + a prop validator,
 *    so unknown/invalid sections never crash the canvas.
 *  - PERSISTABLE: the whole structure is plain JSON-serializable (no
 *    functions, no Dates, no undefined) so it round-trips through MongoDB
 *    and Redux without transformation.
 *  - VERSIONED: `schemaVersion` lets the backend migrate old documents.
 *
 * Shape
 * -----
 *   PageData {
 *     schemaVersion: number,
 *     meta: { title, description, lang, theme: ThemeConfig },
 *     header: HeaderData | null,
 *     sections: Section[],          // ordered, dynamic body
 *     footer: FooterData | null,
 *   }
 * ============================================================================
 */

/**
 * Canonical section type identifiers.
 *
 * Adding a new section type requires:
 *   1. adding the constant here,
 *   2. registering a renderer in `sectionRegistry.jsx`,
 *   3. adding a factory in `createDefaultSection()`,
 *   4. adding a generator branch in `projectGenerator.js`.
 */
export const SECTION_TYPES = Object.freeze({
  HERO: "hero",
  FEATURES: "features",
  CTA: "cta",
  STATS: "stats",
  GALLERY: "gallery",
  TESTIMONIALS: "testimonials",
  PRICING: "pricing",
  CONTACT: "contact",
});

/**
 * The list of section types a user can add from the editor's "add section"
 * menu. Kept as an array (not the frozen object) so it is iterable in JSX.
 */
export const ADDABLE_SECTION_TYPES = Object.freeze([
  SECTION_TYPES.HERO,
  SECTION_TYPES.FEATURES,
  SECTION_TYPES.STATS,
  SECTION_TYPES.GALLERY,
  SECTION_TYPES.TESTIMONIALS,
  SECTION_TYPES.PRICING,
  SECTION_TYPES.CTA,
  SECTION_TYPES.CONTACT,
]);

/** Current schema version. Bump when the shape changes incompatibly. */
export const PAGE_SCHEMA_VERSION = 1;

/**
 * Generate a collision-resistant id for a section. Uses crypto.randomUUID
 * when available (secure context) and falls back to a timestamp+random
 * string otherwise so it works in every browser.
 *
 * @returns {string} unique section id
 */
export function createSectionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `sec_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * Default theme configuration. All values are valid Tailwind class
 * fragments so the generated project can apply them directly.
 *
 * @returns {ThemeConfig}
 */
export function createDefaultTheme() {
  return {
    primary: "#4c7294",
    mode: "light",
    font: "Inter",
    radius: "0.75rem",
  };
}

/**
 * Factory for the fixed Header element.
 *
 * @returns {HeaderData}
 */
export function createDefaultHeader() {
  return {
    brand: "Lume",
    logoText: "Lume",
    links: [
      { id: createSectionId(), label: "Home", href: "#home" },
      { id: createSectionId(), label: "Features", href: "#features" },
      { id: createSectionId(), label: "Pricing", href: "#pricing" },
      { id: createSectionId(), label: "Contact", href: "#contact" },
    ],
    ctaLabel: "Get Started",
    ctaHref: "#cta",
  };
}

/**
 * Factory for the fixed Footer element.
 *
 * @returns {FooterData}
 */
export function createDefaultFooter() {
  return {
    brand: "Lume",
    tagline: "Build beautiful websites with AI.",
    columns: [
      {
        id: createSectionId(),
        title: "Product",
        links: [
          { id: createSectionId(), label: "Features", href: "#features" },
          { id: createSectionId(), label: "Pricing", href: "#pricing" },
        ],
      },
      {
        id: createSectionId(),
        title: "Company",
        links: [
          { id: createSectionId(), label: "About", href: "#" },
          { id: createSectionId(), label: "Contact", href: "#contact" },
        ],
      },
    ],
    socials: [
      { id: createSectionId(), label: "Twitter", href: "#", icon: "twitter" },
      { id: createSectionId(), label: "GitHub", href: "#", icon: "github" },
    ],
    copyright: `© ${new Date().getFullYear()} Lume. All rights reserved.`,
  };
}

/**
 * Factory for a single default section of the given type.
 * Returns `null` for unknown types so callers can guard.
 *
 * @param {string} type - one of SECTION_TYPES
 * @param {Partial<Section>=} overrides - optional field overrides
 * @returns {Section | null}
 */
export function createDefaultSection(type, overrides = {}) {
  const id = createSectionId();
  let section;

  switch (type) {
    case SECTION_TYPES.HERO:
      section = {
        id,
        type,
        eyebrow: "Welcome to Lume",
        title: "Build something beautiful",
        subtitle:
          "Lume turns your ideas into production-ready websites in seconds. No code, no friction.",
        primaryCta: { label: "Get Started", href: "#cta" },
        secondaryCta: { label: "Learn More", href: "#features" },
        image: {
          src: "https://images.unsplash.com/photo-1557804506-666a55525bed?auto=format&fit=crop&w=1200&q=80",
          alt: "Hero illustration",
        },
      };
      break;
    case SECTION_TYPES.FEATURES:
      section = {
        id,
        type,
        eyebrow: "Features",
        title: "Everything you need",
        subtitle: "Powerful features designed to help you ship faster.",
        columns: 3,
        items: [
          {
            id: createSectionId(),
            icon: "sparkles",
            title: "AI Generation",
            description: "Describe your site and let AI build it instantly.",
          },
          {
            id: createSectionId(),
            icon: "layers",
            title: "Component System",
            description: "Clean, typed, reusable sections you can rearrange.",
          },
          {
            id: createSectionId(),
            icon: "rocket",
            title: "One-Click Deploy",
            description: "Publish your site to the web in a single click.",
          },
        ],
      };
      break;
    case SECTION_TYPES.STATS:
      section = {
        id,
        type,
        title: "Trusted by builders everywhere",
        items: [
          { id: createSectionId(), value: "10k+", label: "Sites built" },
          { id: createSectionId(), value: "99.9%", label: "Uptime" },
          { id: createSectionId(), value: "4.9/5", label: "Avg. rating" },
          { id: createSectionId(), value: "24/7", label: "Support" },
        ],
      };
      break;
    case SECTION_TYPES.GALLERY:
      section = {
        id,
        type,
        eyebrow: "Gallery",
        title: "A glimpse of what's possible",
        columns: 3,
        items: [
          {
            id: createSectionId(),
            src: "https://images.unsplash.com/photo-1467230875937-726a3869b425?auto=format&fit=crop&w=800&q=80",
            alt: "Gallery image one",
            caption: "Conferences",
          },
          {
            id: createSectionId(),
            src: "https://images.unsplash.com/photo-1505373877836-4d2f6737e178?auto=format&fit=crop&w=800&q=80",
            alt: "Gallery image two",
            caption: "Workspaces",
          },
          {
            id: createSectionId(),
            src: "https://images.unsplash.com/photo-1517245426990-5737100a6b1b?auto=format&fit=crop&w=800&q=80",
            alt: "Gallery image three",
            caption: "Teams",
          },
        ],
      };
      break;
    case SECTION_TYPES.TESTIMONIALS:
      section = {
        id,
        type,
        eyebrow: "Testimonials",
        title: "Loved by creators",
        items: [
          {
            id: createSectionId(),
            quote:
              "Lume cut our landing-page time from days to minutes. Incredible.",
            author: "Aisha Khan",
            role: "Founder, Nova",
            avatar:
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
          },
          {
            id: createSectionId(),
            quote:
              "The cleanest AI builder I've used. The output is real code.",
            author: "Daniel Reyes",
            role: "Engineer, Loop",
            avatar:
              "https://images.unsplash.com/photo-1500648767791-00dd994e6723?auto=format&fit=crop&w=200&q=80",
          },
        ],
      };
      break;
    case SECTION_TYPES.PRICING:
      section = {
        id,
        type,
        eyebrow: "Pricing",
        title: "Simple, transparent pricing",
        plans: [
          {
            id: createSectionId(),
            name: "Starter",
            price: "$0",
            period: "/mo",
            description: "For trying things out.",
            features: ["1 project", "Community support", "Basic templates"],
            ctaLabel: "Start free",
            ctaHref: "#",
            highlighted: false,
          },
          {
            id: createSectionId(),
            name: "Pro",
            price: "$19",
            period: "/mo",
            description: "For serious builders.",
            features: [
              "Unlimited projects",
              "Priority support",
              "Custom domains",
              "AI iterations",
            ],
            ctaLabel: "Go Pro",
            ctaHref: "#",
            highlighted: true,
          },
        ],
      };
      break;
    case SECTION_TYPES.CTA:
      section = {
        id,
        type,
        title: "Ready to build your site?",
        subtitle: "Join thousands of creators shipping with Lume today.",
        primaryCta: { label: "Get Started Free", href: "#" },
        secondaryCta: { label: "Talk to us", href: "#contact" },
      };
      break;
    case SECTION_TYPES.CONTACT:
      section = {
        id,
        type,
        eyebrow: "Contact",
        title: "Get in touch",
        subtitle: "We'd love to hear from you. Send us a message.",
        email: "hello@lume.ai",
        phone: "+1 (555) 010-2025",
        fields: [
          { id: createSectionId(), name: "name", label: "Name", type: "text" },
          {
            id: createSectionId(),
            name: "email",
            label: "Email",
            type: "email",
          },
          {
            id: createSectionId(),
            name: "message",
            label: "Message",
            type: "textarea",
          },
        ],
        submitLabel: "Send Message",
      };
      break;
    default:
      return null;
  }

  return { ...section, ...overrides };
}

/**
 * Build a complete, valid default PageData document.
 * Used as the initial state for new websites and as a fallback when
 * persisted data is missing/corrupt.
 *
 * @param {Partial<PageData>=} overrides
 * @returns {PageData}
 */
export function createDefaultPageData(overrides = {}) {
  return {
    schemaVersion: PAGE_SCHEMA_VERSION,
    meta: {
      title: "My Lume Site",
      description: "A website built with Lume.ai",
      lang: "en",
      theme: createDefaultTheme(),
    },
    header: createDefaultHeader(),
    sections: [
      createDefaultSection(SECTION_TYPES.HERO),
      createDefaultSection(SECTION_TYPES.FEATURES),
      createDefaultSection(SECTION_TYPES.STATS),
      createDefaultSection(SECTION_TYPES.CTA),
    ],
    footer: createDefaultFooter(),
    ...overrides,
  };
}

/**
 * Deep-clone a JSON-serializable value. Used so the editor never mutates
 * persisted state by reference.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function clonePageData(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

/**
 * Coerce a value into a plain array. Returns [] for non-arrays so the
 * canvas never crashes on malformed persisted data.
 *
 * @param {unknown} value
 * @returns {any[]}
 */
function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Normalize a single section read from persisted storage so it is safe to
 * render. Guarantees `id` and `type` exist; drops sections with unknown
 * types so a corrupt DB document can never crash the canvas.
 *
 * @param {any} raw
 * @returns {Section | null}
 */
export function normalizeSection(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.type || "").toLowerCase();
  if (!Object.values(SECTION_TYPES).includes(type)) return null;

  return {
    ...raw,
    id: raw.id || createSectionId(),
    type,
  };
}

/**
 * Validate + normalize a full PageData document coming from the API or
 * localStorage. This is the defensive boundary that guarantees the canvas
 * always receives a well-formed structure, even if the DB has legacy or
 * partial data.
 *
 * @param {any} raw
 * @returns {PageData}
 */
export function normalizePageData(raw) {
  const base = createDefaultPageData();

  if (!raw || typeof raw !== "object") return base;

  const meta = raw.meta && typeof raw.meta === "object" ? raw.meta : {};
  const theme = meta.theme && typeof meta.theme === "object" ? meta.theme : {};

  const sections = asArray(raw.sections).map(normalizeSection).filter(Boolean);

  return {
    schemaVersion: PAGE_SCHEMA_VERSION,
    meta: {
      title: typeof meta.title === "string" ? meta.title : base.meta.title,
      description:
        typeof meta.description === "string"
          ? meta.description
          : base.meta.description,
      lang: typeof meta.lang === "string" ? meta.lang : base.meta.lang,
      theme: {
        primary:
          typeof theme.primary === "string"
            ? theme.primary
            : base.meta.theme.primary,
        mode:
          typeof theme.mode === "string" ? theme.mode : base.meta.theme.mode,
        font:
          typeof theme.font === "string" ? theme.font : base.meta.theme.font,
        radius:
          typeof theme.radius === "string"
            ? theme.radius
            : base.meta.theme.radius,
      },
    },
    header:
      raw.header && typeof raw.header === "object" ? raw.header : base.header,
    sections: sections.length ? sections : base.sections,
    footer:
      raw.footer && typeof raw.footer === "object" ? raw.footer : base.footer,
  };
}

/**
 * Serialize PageData to a compact JSON string for persistence / transport.
 *
 * @param {PageData} pageData
 * @returns {string}
 */
export function serializePageData(pageData) {
  return JSON.stringify(pageData);
}

/**
 * Parse a persisted PageData JSON string defensively. Returns a valid
 * default document on any parse error so the editor never white-screens.
 *
 * @param {string} json
 * @returns {PageData}
 */
export function parsePageData(json) {
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    return normalizePageData(parsed);
  } catch {
    return createDefaultPageData();
  }
}
