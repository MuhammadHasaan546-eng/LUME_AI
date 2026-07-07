/**
 * ============================================================================
 * Lume Canvas / Preview Component
 * ============================================================================
 *
 * The Canvas is the in-app, React-rendered preview of a PageData document.
 * It accepts the JSON Single Source of Truth and dynamically maps the
 * `sections` array to individual sub-components via the section registry.
 *
 * Responsibilities
 * ----------------
 *  - Render the fixed `header` and `footer` singletons.
 *  - Map over the dynamic `sections` array, resolving each `section.type`
 *    to its component + validated props through the registry.
 *  - Apply the page theme (light/dark mode, font, radius) to the wrapper.
 *  - Support an optional `selectedId` + `onSelect` for the editor's
 *    click-to-select interaction (highlights the active section).
 *  - Support a `device` prop ("desktop" | "tablet" | "mobile") so the editor
 *    can preview responsive widths without re-rendering the whole tree.
 *  - Be deterministic + memoized: reordering one section must not re-render
 *    the others (achieved via React.memo on every section component + a
 *    stable key = section.id).
 *
 * This component is intentionally presentational. It never mutates pageData;
 * all edits flow up through `onSelect` / editor callbacks.
 * ============================================================================
 */
import React, { memo, useMemo, useCallback } from "react";
import { normalizePageData } from "./schema/pageData";
import {
  SECTION_REGISTRY,
  FIXED_REGISTRY,
  validateSectionProps,
} from "./sections/sectionRegistry";

/* ----------------------------------------------------------- device widths */

/**
 * Max-width (px) for each preview device. The canvas scales its inner
 * content to this width so the editor can simulate responsive layouts.
 */
export const DEVICE_WIDTHS = Object.freeze({
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
});

/* ------------------------------------------------------- theme application */

/**
 * Build inline CSS variables + a class list from the page theme so the
 * canvas reflects the user's chosen primary color, radius, and font without
 * requiring a Tailwind rebuild. Dark mode is toggled via a `dark` class.
 *
 * @param {object} theme - the pageData.meta.theme object
 * @returns {{className:string, style:React.CSSProperties}}
 */
function applyTheme(theme = {}) {
  const isDark = theme.mode === "dark";
  const style = {
    // Expose the primary color as a CSS var so generated projects + the
    // canvas share the same source of truth for accent colors.
    "--lume-primary": theme.primary || "#4c7294",
    "--lume-radius": theme.radius || "0.75rem",
    fontFamily: theme.font
      ? `'${theme.font}', ui-sans-serif, system-ui, sans-serif`
      : undefined,
  };
  return {
    className: isDark ? "dark" : "",
    style,
  };
}

/* ----------------------------------------------------- section wrapper row */

/**
 * A thin wrapper around each dynamic section that:
 *  - forwards validated props to the real component,
 *  - renders an editor-only selection ring when `selectedId` matches,
 *  - calls `onSelect(sectionId)` on click (editor interaction).
 *
 * It is memoized so that selecting/reordering one section does not
 * re-render the others (props are stable per section.id).
 */
const SectionRenderer = memo(function SectionRenderer({
  section,
  selectedId,
  onSelect,
  editable,
}) {
  const entry = SECTION_REGISTRY[section.type];
  const isSelected = editable && selectedId === section.id;

  // Validate props defensively. If the type is unknown, render nothing.
  const props = useMemo(
    () => (entry ? entry.validate(section) : null),
    [entry, section],
  );

  const handleClick = useCallback(
    (e) => {
      if (!editable || !onSelect) return;
      e.stopPropagation();
      onSelect(section.id);
    },
    [editable, onSelect, section.id],
  );

  if (!entry || !props) return null;
  const Component = entry.component;

  // When not editable, render the component directly with no wrapper so the
  // output matches the deployed LiveSite exactly.
  if (!editable) {
    return <Component {...props} />;
  }

  return (
    <div
      data-section-id={section.id}
      data-section-type={section.type}
      onClick={handleClick}
      className={`relative transition ${
        isSelected
          ? "ring-2 ring-purple-500 ring-inset"
          : "ring-1 ring-transparent hover:ring-2 hover:ring-purple-300 hover:ring-inset"
      }`}
    >
      {/* Editor-only label badge */}
      <span
        className={`pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow ${
          isSelected ? "opacity-100" : "opacity-0"
        } transition-opacity`}
      >
        {entry.label}
      </span>
      <Component {...props} />
    </div>
  );
});

/* ------------------------------------------------------------- the canvas */

/**
 * The Canvas component.
 *
 * @param {object} props
 * @param {object} props.pageData - the PageData Single Source of Truth
 * @param {boolean} [props.editable=false] - enable editor interactions
 *   (click-to-select, selection ring, label badges)
 * @param {string} [props.selectedId] - id of the currently selected section
 * @param {(sectionId:string)=>void} [props.onSelect] - click-to-select cb
 * @param {"desktop"|"tablet"|"mobile"} [props.device="desktop"] - preview width
 * @param {string} [props.className] - extra classes for the outer wrapper
 */
function CanvasBase({
  pageData,
  editable = false,
  selectedId,
  onSelect,
  device = "desktop",
  className = "",
}) {
  // Always normalize at the boundary so corrupt/legacy data never crashes.
  const data = useMemo(() => normalizePageData(pageData), [pageData]);
  const theme = useMemo(() => applyTheme(data.meta.theme), [data.meta.theme]);
  const width = DEVICE_WIDTHS[device] || DEVICE_WIDTHS.desktop;

  // Pre-validate every section once per render. Unknown types are dropped.
  const sections = useMemo(
    () =>
      data.sections
        .map((section) => ({
          section,
          props: validateSectionProps(section),
        }))
        .filter((item) => item.props !== null),
    [data.sections],
  );

  // Header / footer validated props (fixed singletons).
  const headerProps = useMemo(
    () => (data.header ? FIXED_REGISTRY.header.validate(data.header) : null),
    [data.header],
  );
  const footerProps = useMemo(
    () => (data.footer ? FIXED_REGISTRY.footer.validate(data.footer) : null),
    [data.footer],
  );

  // Clicking empty canvas area deselects (editor only).
  const handleBackgroundClick = useCallback(() => {
    if (editable && onSelect) onSelect(null);
  }, [editable, onSelect]);

  const HeaderComponent = FIXED_REGISTRY.header.component;
  const FooterComponent = FIXED_REGISTRY.footer.component;

  return (
    <div
      className={`min-h-full bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${theme.className} ${className}`}
      style={theme.style}
    >
      {/* The scaled preview surface. Width simulates the device; the
          inner content scrolls if taller than the viewport. */}
      <div
        className="mx-auto min-h-full bg-white shadow-xl transition-[max-width] duration-300 dark:bg-zinc-950"
        style={{ maxWidth: width }}
        onClick={handleBackgroundClick}
      >
        {/* Fixed header */}
        {headerProps ? <HeaderComponent {...headerProps} /> : null}

        {/* Dynamic body sections */}
        <main>
          {sections.length === 0 && editable ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-zinc-400">
              <p className="text-sm font-medium">No sections yet</p>
              <p className="text-xs">
                Use the “Add section” menu to insert your first component.
              </p>
            </div>
          ) : (
            sections.map(({ section }) => (
              <SectionRenderer
                key={section.id}
                section={section}
                selectedId={selectedId}
                onSelect={onSelect}
                editable={editable}
              />
            ))
          )}
        </main>

        {/* Fixed footer */}
        {footerProps ? <FooterComponent {...footerProps} /> : null}
      </div>
    </div>
  );
}

/**
 * Memoized Canvas. Re-renders only when pageData identity, selectedId, or
 * device changes. Because every child section is itself memoized, editing
 * one section's props re-renders only that section.
 */
export const Canvas = memo(CanvasBase);

export default Canvas;
