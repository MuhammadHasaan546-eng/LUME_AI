/**
 * ============================================================================
 * Lume Section Components
 * ============================================================================
 *
 * Each section type has a dedicated, typed, memoized, accessible React
 * component. They accept clean, typed props (derived from the JSON
 * page-data) and render Tailwind-styled markup.
 *
 * Conventions
 * -----------
 *  - Every component is wrapped in React.memo so reordering one section
 *    does not re-render the others (the canvas maps over an array).
 *  - Every component receives a stable `id` used as the anchor target for
 *    in-page navigation (header links → #<id>).
 *  - Images always carry an `alt` and use responsive object-cover sizing.
 *  - Interactive elements are keyboard accessible (real <button>/<a>).
 *  - No external runtime deps beyond react + lucide-react.
 * ============================================================================
 */
import React, { memo } from "react";
import { ArrowRight, Check, Mail, Phone } from "lucide-react";
import { getIcon } from "./icons";

/* ------------------------------------------------------------------ Header */

/**
 * Fixed site header / navigation bar.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.brand
 * @param {string} props.logoText
 * @param {Array<{id:string,label:string,href:string}>} props.links
 * @param {string} props.ctaLabel
 * @param {string} props.ctaHref
 */
function HeaderBase({ id, brand, logoText, links = [], ctaLabel, ctaHref }) {
  return (
    <header
      id={id}
      className="sticky top-0 z-40 w-full border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80"
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <a
          href="#home"
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-black text-white">
            {(logoText || brand || "L").charAt(0)}
          </span>
          <span>{brand || logoText}</span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {ctaLabel ? (
          <a
            href={ctaHref || "#"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-white dark:text-zinc-900"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </nav>
    </header>
  );
}

export const Header = memo(HeaderBase);

/* -------------------------------------------------------------------- Hero */

/**
 * Hero section — headline, subtitle, dual CTAs, and a responsive image.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {{label:string,href:string}} props.primaryCta
 * @param {{label:string,href:string}} props.secondaryCta
 * @param {{src:string,alt:string}} props.image
 */
function HeroBase({
  id,
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  image,
}) {
  return (
    <section
      id={id}
      className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white py-20 dark:from-zinc-950 dark:to-zinc-900 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {primaryCta?.label ? (
              <a
                href={primaryCta.href || "#"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
            {secondaryCta?.label ? (
              <a
                href={secondaryCta.href || "#"}
                className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>

        {image?.src ? (
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-xl dark:border-zinc-800">
              <img
                src={image.src}
                alt={image.alt || ""}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const Hero = memo(HeroBase);

/* ---------------------------------------------------------------- Features */

/**
 * Features grid — responsive columns of icon + title + description cards.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {number} props.columns
 * @param {Array<{id:string,icon:string,title:string,description:string}>} props.items
 */
function FeaturesBase({
  id,
  eyebrow,
  title,
  subtitle,
  columns = 3,
  items = [],
}) {
  const colClass =
    columns >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className={`mt-12 grid gap-6 ${colClass}`}>
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-purple-500">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {item.description}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const Features = memo(FeaturesBase);

/* ------------------------------------------------------------------- Stats */

/**
 * Stats band — a row of big-number/value pairs.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.title
 * @param {Array<{id:string,value:string,label:string}>} props.items
 */
function StatsBase({ id, title, items = [] }) {
  return (
    <section id={id} className="bg-zinc-50 py-16 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {title ? (
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            {title}
          </h2>
        ) : null}
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((stat) => (
            <div
              key={stat.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export const Stats = memo(StatsBase);

/* ----------------------------------------------------------------- Gallery */

/**
 * Gallery — responsive image grid with captions.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {number} props.columns
 * @param {Array<{id:string,src:string,alt:string,caption:string}>} props.items
 */
function GalleryBase({ id, eyebrow, title, columns = 3, items = [] }) {
  const colClass =
    columns >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
        </div>
        <div className={`mt-12 grid gap-4 ${colClass}`}>
          {items.map((item) => (
            <figure
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <img
                src={item.src}
                alt={item.alt || ""}
                loading="lazy"
                className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-semibold text-white">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export const Gallery = memo(GalleryBase);

/* ----------------------------------------------------------- Testimonials */

/**
 * Testimonials — quote cards with avatar, author, and role.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {Array<{id:string,quote:string,author:string,role:string,avatar:string}>} props.items
 */
function TestimonialsBase({ id, eyebrow, title, items = [] }) {
  return (
    <section id={id} className="bg-zinc-50 py-20 dark:bg-zinc-900 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <figure
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <blockquote className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={item.author || ""}
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">
                    {item.author}
                  </div>
                  {item.role ? (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.role}
                    </div>
                  ) : null}
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

/* ----------------------------------------------------------------- Pricing */

/**
 * Pricing — plan cards with feature lists and a highlighted plan.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {Array<{id:string,name:string,price:string,period:string,description:string,features:string[],ctaLabel:string,ctaHref:string,highlighted:boolean}>} props.plans
 */
function PricingBase({ id, eyebrow, title, plans = [] }) {
  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition ${
                plan.highlighted
                  ? "border-purple-500 bg-gradient-to-b from-purple-500/5 to-transparent shadow-lg"
                  : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50"
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Popular
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {plan.name}
              </h3>
              {plan.description ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {plan.description}
                </p>
              ) : null}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  {plan.price}
                </span>
                {plan.period ? (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {plan.period}
                  </span>
                ) : null}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {(plan.features || []).map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.ctaLabel ? (
                <a
                  href={plan.ctaHref || "#"}
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90"
                      : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
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

/* -------------------------------------------------------------------- CTA */

/**
 * Call-to-action band — centered headline + dual buttons.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {{label:string,href:string}} props.primaryCta
 * @param {{label:string,href:string}} props.secondaryCta
 */
function CtaBase({ id, title, subtitle, primaryCta, secondaryCta }) {
  return (
    <section id={id} className="bg-zinc-50 py-20 dark:bg-zinc-900 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-6 py-16 text-center shadow-xl sm:px-12">
          {title ? (
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primaryCta?.label ? (
              <a
                href={primaryCta.href || "#"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow transition hover:bg-zinc-100"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
            {secondaryCta?.label ? (
              <a
                href={secondaryCta.href || "#"}
                className="inline-flex items-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
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

/* ----------------------------------------------------------------- Contact */

/**
 * Contact section — info + a controlled, accessible form.
 * The form is intentionally non-submitting (preventDefault) so it is safe
 * inside the sandboxed preview.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {string} props.email
 * @param {string} props.phone
 * @param {Array<{id:string,name:string,label:string,type:string}>} props.fields
 * @param {string} props.submitLabel
 */
function ContactBase({
  id,
  eyebrow,
  title,
  subtitle,
  email,
  phone,
  fields = [],
  submitLabel,
}) {
  return (
    <section id={id} className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">
              {subtitle}
            </p>
          ) : null}
          <ul className="mt-8 space-y-3">
            {email ? (
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <Mail className="h-5 w-5 text-purple-500" />
                <a href={`mailto:${email}`} className="hover:underline">
                  {email}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <Phone className="h-5 w-5 text-purple-500" />
                <a href={`tel:${phone}`} className="hover:underline">
                  {phone}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
          aria-label="Contact form"
        >
          <div className="space-y-4">
            {fields.map((field) => {
              const isTextarea = field.type === "textarea";
              const sharedClass =
                "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white";
              return (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    {field.label}
                  </label>
                  {isTextarea ? (
                    <textarea
                      id={field.id}
                      name={field.name}
                      rows={4}
                      className={sharedClass}
                    />
                  ) : (
                    <input
                      id={field.id}
                      name={field.name}
                      type={field.type || "text"}
                      className={sharedClass}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {submitLabel ? (
            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
            >
              {submitLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
}

export const Contact = memo(ContactBase);

/* ------------------------------------------------------------------ Footer */

/**
 * Fixed site footer — brand, link columns, socials, copyright.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.brand
 * @param {string} props.tagline
 * @param {Array<{id:string,title:string,links:Array<{id:string,label:string,href:string}>}>} props.columns
 * @param {Array<{id:string,label:string,href:string,icon:string}>} props.socials
 * @param {string} props.copyright
 */
function FooterBase({
  id,
  brand,
  tagline,
  columns = [],
  socials = [],
  copyright,
}) {
  return (
    <footer
      id={id}
      className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-lg font-extrabold text-zinc-900 dark:text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-black text-white">
                {(brand || "L").charAt(0)}
              </span>
              {brand}
            </div>
            {tagline ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {tagline}
              </p>
            ) : null}
          </div>

          {columns.map((col) => (
            <div key={col.id}>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {(col.links || []).map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row">
          {copyright ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {copyright}
            </p>
          ) : null}
          {socials.length ? (
            <ul className="flex items-center gap-3">
              {socials.map((social) => {
                const Icon = getIcon(social.icon);
                return (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-purple-500 hover:text-purple-500 dark:border-zinc-800 dark:text-zinc-400"
                    >
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
