/**
 * ============================================================================
 * Lume Section Registry
 * ============================================================================
 *
 * The single place that maps a section `type` (the string stored in the JSON
 * page-data) to:
 *
 * 1. The React component that renders it (from SectionComponents.jsx).
 * 2. A human-readable label + lucide icon, used by the editor's "add
 * section" menu and the section list.
 * 3. A lightweight prop validator that strips/flags invalid props so a
 * corrupt DB document can never crash the canvas.
 *
 * Why a registry?
 * The canvas maps over `sections: Section[]` and needs to resolve
 * `section.type` → component in O(1). Centralizing it here means adding a
 * new section type is a one-file change (register it here + add the
 * component + add the factory), and every consumer (Canvas, editor UI,
 * project generator) stays in sync.
 *
 * This module is UI-agnostic: it returns components and metadata, never JSX
 * of its own (except via the render helper). It is safe to import from both
 * the editor and the generated WebContainer project template.
 * ============================================================================
 */
import {
  Sparkles,
  LayoutGrid,
  Megaphone,
  BarChart3,
  Images,
  Quote,
  CreditCard,
  Mail,
} from "lucide-react";

import { SECTION_TYPES } from "../schema/pageData";
import {
  Header,
  Hero,
  Features,
  Stats,
  Gallery,
  Testimonials,
  Pricing,
  Cta,
  Contact,
  Footer,
} from "./SectionComponents";

/* ------------------------------------------------------------------ helpers */

/**
 * Coerce a value to a plain array. Returns [] for non-arrays.
 * @param {unknown} value
 * @returns {any[]}
 */
const toArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Coerce a value to a string. Returns "" for non-strings.
 * @param {unknown} value
 * @returns {string}
 */
const toStr = (value) => (typeof value === "string" ? value : "");

/**
 * Coerce a value to a number, falling back to a default.
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
const toNum = (value, fallback) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/**
 * Normalize a CTA object ({ label, href }).
 * @param {unknown} value
 * @returns {{label:string,href:string}|undefined}
 */
const toCta = (value) => {
  if (!value || typeof value !== "object") return undefined;
  const label = toStr(value.label);
  if (!label) return undefined;
  return { label, href: toStr(value.href) || "#" };
};

/* --------------------------------------------------------- prop validators */

/**
 * Each validator takes a raw section object (already normalized for id/type)
 * and returns a *clean* props object that is guaranteed safe to spread into
 * the matching component. This is the defensive boundary between persisted
 * JSON and the React components.
 *
 * Validators never throw — they always return a usable props object.
 */

const validateHero = (s) => ({
  id: s.id,
  eyebrow: toStr(s.eyebrow),
  title: toStr(s.title),
  subtitle: toStr(s.subtitle),
  primaryCta: toCta(s.primaryCta),
  secondaryCta: toCta(s.secondaryCta),
  image:
    s.image && typeof s.image === "object"
      ? { src: toStr(s.image.src), alt: toStr(s.image.alt) }
      : undefined,
});

const validateFeatures = (s) => ({
  id: s.id,
  eyebrow: toStr(s.eyebrow),
  title: toStr(s.title),
  subtitle: toStr(s.subtitle),
  columns: toNum(s.columns, 3),
  items: toArray(s.items).map((item) => ({
    id: toStr(item.id) || String(Math.random()),
    icon: toStr(item.icon),
    title: toStr(item.title),
    description: toStr(item.description),
  })),
});

const validateStats = (s) => ({
  id: s.id,
  title: toStr(s.title),
  items: toArray(s.items).map((item) => ({
    id: toStr(item.id) || String(Math.random()),
    value: toStr(item.value),
    label: toStr(item.label),
  })),
});

const validateGallery = (s) => ({
  id: s.id,
  eyebrow: toStr(s.eyebrow),
  title: toStr(s.title),
  columns: toNum(s.columns, 3),
  items: toArray(s.items).map((item) => ({
    id: toStr(item.id) || String(Math.random()),
    src: toStr(item.src),
    alt: toStr(item.alt),
    caption: toStr(item.caption),
  })),
});

const validateTestimonials = (s) => ({
  id: s.id,
  eyebrow: toStr(s.eyebrow),
  title: toStr(s.title),
  items: toArray(s.items).map((item) => ({
    id: toStr(item.id) || String(Math.random()),
    quote: toStr(item.quote),
    author: toStr(item.author),
    role: toStr(item.role),
    avatar: toStr(item.avatar),
  })),
});

const validatePricing = (s) => ({
  id: s.id,
  eyebrow: toStr(s.eyebrow),
  title: toStr(s.title),
  plans: toArray(s.plans).map((plan) => ({
    id: toStr(plan.id) || String(Math.random()),
    name: toStr(plan.name),
    price: toStr(plan.price),
    period: toStr(plan.period),
    description: toStr(plan.description),
    features: toArray(plan.features).map(toStr),
    ctaLabel: toStr(plan.ctaLabel),
    ctaHref: toStr(plan.ctaHref) || "#",
    highlighted: Boolean(plan.highlighted),
  })),
});

const validateCta = (s) => ({
  id: s.id,
  title: toStr(s.title),
  subtitle: toStr(s.subtitle),
  primaryCta: toCta(s.primaryCta),
  secondaryCta: toCta(s.secondaryCta),
});

const validateContact = (s) => ({
  id: s.id,
  eyebrow: toStr(s.eyebrow),
  title: toStr(s.title),
  subtitle: toStr(s.subtitle),
  email: toStr(s.email),
  phone: toStr(s.phone),
  fields: toArray(s.fields).map((field) => ({
    id: toStr(field.id) || String(Math.random()),
    name: toStr(field.name),
    label: toStr(field.label),
    type: toStr(field.type) || "text",
  })),
  submitLabel: toStr(s.submitLabel),
});

/* ----------------------------------------------------------- the registry */

/**
 * The canonical registry. Each entry binds a SECTION_TYPES value to:
 * - component: the memoized React component
 * - validate:  the prop validator (raw section → clean props)
 * - label:     human-readable name (editor UI)
 * - icon:      lucide icon component (editor UI)
 * - description: short helper text (editor UI)
 *
 * Order is intentional and matches the "add section" menu order.
 */
export const SECTION_REGISTRY = Object.freeze({
  [SECTION_TYPES.HERO]: {
    type: SECTION_TYPES.HERO,
    component: Hero,
    validate: validateHero,
    label: "Hero",
    icon: Sparkles,
    description: "Headline, subtitle, and call-to-action buttons.",
  },
  [SECTION_TYPES.FEATURES]: {
    type: SECTION_TYPES.FEATURES,
    component: Features,
    validate: validateFeatures,
    label: "Features",
    icon: LayoutGrid,
    description: "A responsive grid of icon + title + description cards.",
  },
  [SECTION_TYPES.STATS]: {
    type: SECTION_TYPES.STATS,
    component: Stats,
    validate: validateStats,
    label: "Stats",
    icon: BarChart3,
    description: "A band of big-number / value pairs.",
  },
  [SECTION_TYPES.GALLERY]: {
    type: SECTION_TYPES.GALLERY,
    component: Gallery,
    validate: validateGallery,
    label: "Gallery",
    icon: Images,
    description: "A responsive image grid with captions.",
  },
  [SECTION_TYPES.TESTIMONIALS]: {
    type: SECTION_TYPES.TESTIMONIALS,
    component: Testimonials,
    validate: validateTestimonials,
    label: "Testimonials",
    icon: Quote,
    description: "Quote cards with avatar, author, and role.",
  },
  [SECTION_TYPES.PRICING]: {
    type: SECTION_TYPES.PRICING,
    component: Pricing,
    validate: validatePricing,
    label: "Pricing",
    icon: CreditCard,
    description: "Plan cards with feature lists and a highlighted plan.",
  },
  [SECTION_TYPES.CTA]: {
    type: SECTION_TYPES.CTA,
    component: Cta,
    validate: validateCta,
    label: "Call to Action",
    icon: Megaphone,
    description: "A centered headline + dual buttons band.",
  },
  [SECTION_TYPES.CONTACT]: {
    type: SECTION_TYPES.CONTACT,
    component: Contact,
    validate: validateContact,
    label: "Contact",
    icon: Mail,
    description: "Contact info + an accessible, non-submitting form.",
  },
});

/**
 * Fixed-element registry. Header and Footer are singletons (not part of the
 * dynamic `sections` array), so they live in their own map. They reuse the
 * same { component, validate, label, icon } shape for UI consistency.
 */
export const FIXED_REGISTRY = Object.freeze({
  header: {
    component: Header,
    label: "Header",
    icon: LayoutGrid,
    validate: (h) => ({
      id: toStr(h.id) || "site-header",
      brand: toStr(h.brand),
      logoText: toStr(h.logoText),
      links: toArray(h.links).map((link) => ({
        id: toStr(link.id) || String(Math.random()),
        label: toStr(link.label),
        href: toStr(link.href) || "#",
      })),
      ctaLabel: toStr(h.ctaLabel),
      ctaHref: toStr(h.ctaHref) || "#",
    }),
  },
  footer: {
    component: Footer,
    label: "Footer",
    icon: LayoutGrid,
    validate: (f) => ({
      id: toStr(f.id) || "site-footer",
      brand: toStr(f.brand),
      tagline: toStr(f.tagline),
      columns: toArray(f.columns).map((col) => ({
        id: toStr(col.id) || String(Math.random()),
        title: toStr(col.title),
        links: toArray(col.links).map((link) => ({
          id: toStr(link.id) || String(Math.random()),
          label: toStr(link.label),
          href: toStr(link.href) || "#",
        })),
      })),
      socials: toArray(f.socials).map((social) => ({
        id: toStr(social.id) || String(Math.random()),
        label: toStr(social.label),
        href: toStr(social.href) || "#",
        icon: toStr(social.icon),
      })),
      copyright: toStr(f.copyright),
    }),
  },
});

/* ------------------------------------------------------------- public API */

/**
 * Look up a registry entry for a dynamic section type.
 * @param {string} type
 * @returns {object | undefined}
 */
export function getSectionEntry(type) {
  return SECTION_REGISTRY[type];
}

/**
 * Resolve a section type to its React component, or undefined if unknown.
 * @param {string} type
 * @returns {React.ComponentType | undefined}
 */
export function getSectionComponent(type) {
  return SECTION_REGISTRY[type]?.component;
}

/**
 * Validate a raw section's props against its registry entry.
 * Returns a clean props object, or null if the type is unknown.
 *
 * @param {object} section
 * @returns {object | null}
 */
export function validateSectionProps(section) {
  const entry = SECTION_REGISTRY[section?.type];
  if (!entry) return null;
  return entry.validate(section);
}

/**
 * The list of registry entries (in canonical order) for the editor's
 * "add section" menu. Each entry includes label/icon/description.
 *
 * @returns {Array<{type:string,label:string,icon:React.ComponentType,description:string}>}
 */
export function getAddableSections() {
  return Object.values(SECTION_REGISTRY).map((entry) => ({
    type: entry.type,
    label: entry.label,
    icon: entry.icon,
    description: entry.description,
  }));
}

/**
 * Human-readable label for a section type. Falls back to the type string.
 * @param {string} type
 * @returns {string}
 */
export function getSectionLabel(type) {
  return SECTION_REGISTRY[type]?.label ?? type;
}

export default SECTION_REGISTRY;
