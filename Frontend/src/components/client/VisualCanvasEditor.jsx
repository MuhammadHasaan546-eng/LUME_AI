/**
 * ============================================================================
 * Lume Visual Canvas Editor
 * ============================================================================
 *
 * A self-contained, presentational visual editor whose canvas workspace
 * renders the LIVE website UI directly from the PageData Single Source of
 * Truth — NOT the project's code or file structure.
 *
 * What it does
 * ------------
 *   - Renders the actual, typed website (header + dynamic sections + footer)
 *     inside an editable canvas workspace using the shared <Canvas />.
 *   - Lets the user add, remove, duplicate, and reorder body sections and
 *     see the live UI update instantly (click-to-select + selection ring).
 *   - Switches the live preview between desktop / tablet / mobile widths.
 *   - Toggles light / dark theme on the rendered UI.
 *   - Exports the current PageData as JSON.
 *
 * What it does NOT do
 * -------------------
 *   - It never shows source code, a file tree, or a terminal. The workspace
 *     is purely a visual, WYSIWYG rendering of the website UI.
 *
 * It is intentionally free of Redux / react-router dependencies so it can be
 * mounted anywhere. Pass `initialPageData` to seed it; otherwise it boots
 * with a sensible default document.
 *
 * Props
 * -----
 * @param {object|null} [initialPageData] - PageData SSoT (null → defaults)
 * @param {(pd:object)=>void} [onChange]   - fired on every edit (debounce upstream)
 * @param {string} [title]                 - workspace title for the header
 * @param {()=>void} [onBack]              - optional back navigation
 * ============================================================================
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  Download,
  Layers,
  MousePointerClick,
  RefreshCw,
  Eye,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Canvas, DEVICE_WIDTHS } from "@/editor/Canvas";
import {
  createDefaultPageData,
  createDefaultSection,
  createSectionId,
  normalizePageData,
  serializePageData,
  clonePageData,
} from "@/editor/schema/pageData";
import {
  getAddableSections,
  getSectionEntry,
} from "@/editor/sections/sectionRegistry";

/* ======================================================================= */
/*  Immutable pageData update helpers                                       */
/*  (mirrors the pattern in Editor.jsx so edits never mutate by reference)  */
/* ======================================================================= */

/** Return a new pageData whose `sections` array has been transformed. */
function updateSections(pageData, updater) {
  const next = updater(pageData.sections);
  return { ...pageData, sections: next };
}

/** Append a new default section of `type`. */
function addSection(pageData, type) {
  const section = createDefaultSection(type);
  if (!section) return pageData;
  return updateSections(pageData, (sections) => [...sections, section]);
}

/** Remove the section with the given id. */
function removeSection(pageData, id) {
  return updateSections(pageData, (sections) =>
    sections.filter((s) => s.id !== id),
  );
}

/** Deep-clone a section and insert the copy right after the original. */
function duplicateSection(pageData, id) {
  return updateSections(pageData, (sections) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx === -1) return sections;
    const copy = clonePageData(sections[idx]);
    copy.id = createSectionId();
    return [...sections.slice(0, idx + 1), copy, ...sections.slice(idx + 1)];
  });
}

/** Move a section up or down by one position. */
function moveSection(pageData, id, direction) {
  return updateSections(pageData, (sections) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx === -1) return sections;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return sections;
    const next = [...sections];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    return next;
  });
}

/** Toggle the page theme mode between "light" and "dark". */
function toggleThemeMode(pageData) {
  const current = pageData?.meta?.theme?.mode || "light";
  return {
    ...pageData,
    meta: {
      ...pageData.meta,
      theme: {
        ...pageData.meta.theme,
        mode: current === "dark" ? "light" : "dark",
      },
    },
  };
}

/* ======================================================================= */
/*  Section list item (sidebar)                                            */
/* ======================================================================= */

function SectionListItem({
  section,
  index,
  total,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) {
  const entry = getSectionEntry(section.type);
  const Icon = entry?.icon || Layers;
  const label = entry?.label || section.type;

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-all ${
        isSelected
          ? "border-[#4C7294]/40 bg-[#4C7294]/10"
          : "border-transparent hover:border-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40"
      }`}
    >
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 text-left"
        title="Select section"
      >
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${
            isSelected ? "text-[#4C7294]" : "text-zinc-400"
          }`}
        />
        <span className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className="text-[9px] font-mono text-zinc-400">#{index + 1}</span>
      </button>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move up"
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 disabled:opacity-20 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-300"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move down"
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 disabled:opacity-20 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-300"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
        <button
          onClick={onDuplicate}
          title="Duplicate"
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-300"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="rounded p-0.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ======================================================================= */
/*  Add-section dropdown menu                                               */
/* ======================================================================= */

function AddSectionMenu({ onAdd, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sections = useMemo(() => getAddableSections(), []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#4C7294]/30 bg-[#4C7294]/5 px-3 py-2 text-[11px] font-semibold text-[#4C7294] transition-all hover:bg-[#4C7294]/10 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Section
      </button>

      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.type}
                  onClick={() => {
                    onAdd(s.type);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4C7294]" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                      {s.label}
                    </p>
                    <p className="truncate text-[10px] text-zinc-400">
                      {s.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================================================================= */
/*  Main Visual Canvas Editor                                               */
/* ======================================================================= */

function VisualCanvasEditor({
  initialPageData = null,
  onChange = null,
  title = "Visual Canvas Editor",
  onBack = null,
}) {
  /* ── pageData state (controlled/uncontrolled) ─────────────────────── */
  const [pageData, setPageData] = useState(() =>
    initialPageData
      ? normalizePageData(initialPageData)
      : createDefaultPageData(),
  );
  const [prevInitial, setPrevInitial] = useState(initialPageData);

  // Sync from prop when the parent supplies a new pageData identity.
  if (initialPageData && initialPageData !== prevInitial) {
    setPrevInitial(initialPageData);
    setPageData(normalizePageData(initialPageData));
  }

  /**
   * Central mutator: applies `updater` to pageData and notifies the parent
   * via `onChange` so it can persist (debounced upstream).
   */
  const updatePageData = useCallback(
    (updater) => {
      setPageData((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (onChange) onChange(next);
        return next;
      });
    },
    [onChange],
  );

  /* ── UI state ──────────────────────────────────────────────────────── */
  const [device, setDevice] = useState("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  // `isDark` is derived directly from the pageData theme mode — no separate
  // state needed, which avoids a cascading setState-in-effect render. The
  // editor chrome stays in sync with the rendered canvas automatically.
  const isDark = pageData?.meta?.theme?.mode === "dark";

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const handleAddSection = useCallback(
    (type) => {
      updatePageData((pd) => addSection(pd, type));
      toast.success(
        `${getSectionEntry(type)?.label || type} section added to canvas.`,
      );
    },
    [updatePageData],
  );

  const handleRemoveSection = useCallback(
    (id) => {
      updatePageData((pd) => removeSection(pd, id));
      if (selectedSectionId === id) setSelectedSectionId(null);
      toast.success("Section removed from canvas.");
    },
    [updatePageData, selectedSectionId],
  );

  const handleDuplicateSection = useCallback(
    (id) => {
      updatePageData((pd) => duplicateSection(pd, id));
      toast.success("Section duplicated.");
    },
    [updatePageData],
  );

  const handleMoveSection = useCallback(
    (id, direction) => {
      updatePageData((pd) => moveSection(pd, id, direction));
    },
    [updatePageData],
  );

  const handleToggleTheme = useCallback(() => {
    updatePageData((pd) => toggleThemeMode(pd));
  }, [updatePageData]);

  const handleReset = useCallback(() => {
    updatePageData(() => createDefaultPageData());
    setSelectedSectionId(null);
    toast.success("Canvas reset to default layout.");
  }, [updatePageData]);

  const handleExport = useCallback(() => {
    const blob = new Blob([serializePageData(pageData)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pageData.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("pageData.json exported.");
  }, [pageData]);

  const handleSelect = useCallback((id) => {
    setSelectedSectionId((prev) => (prev === id ? null : id));
  }, []);

  /* ── Derived values ───────────────────────────────────────────────── */

  const sections = pageData.sections;
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId],
  );
  const selectedEntry = selectedSection
    ? getSectionEntry(selectedSection.type)
    : null;

  const deviceWidth = DEVICE_WIDTHS[device] || DEVICE_WIDTHS.desktop;

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div
      className={`flex h-screen w-full flex-col overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary/20 ${
        isDark ? "dark" : ""
      }`}
      style={{
        // Entire font stack enclosed in a single string literal — required
        // for valid JSX inline-style syntax (avoids the esbuild parse error).
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="lume-header-accent lume-glass sticky top-0 z-50 flex h-14 min-h-[56px] items-center justify-between border-b border-border/40 bg-background/60 px-6 transition-all duration-300">
        <div className="flex items-center gap-4">
          {onBack && (
            <Motion.button
              onClick={onBack}
              whileHover={{ scale: 1.03, x: -1 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-border/60 bg-muted/30 p-2 text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground hover:border-primary/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Motion.button>
          )}

          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold tracking-tight text-foreground">
                {title}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Visual Canvas
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme toggle */}
          <button
            onClick={handleToggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted/80"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span className="hidden sm:inline">
              {isDark ? "Light" : "Dark"}
            </span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            title="Reset canvas to default layout"
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted/80"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-[0_4px_20px_-4px_rgba(76,114,148,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Download className="h-3 w-3 stroke-[2.5]" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="relative flex w-full flex-1 overflow-hidden">
        {/* COLUMN 1: LEFT SIDEBAR — section manager */}
        <aside className="hidden h-full w-[300px] shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-100/50 transition-colors duration-500 dark:border-zinc-900 dark:bg-[#09090A] md:flex">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-900/80">
            <Layers className="h-3.5 w-3.5 text-[#4C7294]" />
            <span className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
              Sections
            </span>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">
              {sections.length} block{sections.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Section list */}
          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
            {sections.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
                <p className="text-[11px] text-zinc-400">
                  No sections yet. Add one below to start building.
                </p>
              </div>
            ) : (
              sections.map((section, idx) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  index={idx}
                  total={sections.length}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => handleSelect(section.id)}
                  onMoveUp={() => handleMoveSection(section.id, "up")}
                  onMoveDown={() => handleMoveSection(section.id, "down")}
                  onDuplicate={() => handleDuplicateSection(section.id)}
                  onDelete={() => handleRemoveSection(section.id)}
                />
              ))
            )}
          </div>

          {/* Add section */}
          <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-900/60">
            <AddSectionMenu onAdd={handleAddSection} disabled={false} />
          </div>
        </aside>

        {/* COLUMN 2: CENTER — the live website UI canvas workspace */}
        <main className="flex h-full min-w-0 flex-1 flex-col bg-zinc-50 transition-colors duration-500 dark:bg-[#0C0C0C]">
          {/* Canvas toolbar */}
          <div className="flex h-10 min-h-[40px] shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-900/80 dark:bg-[#0E0E10]">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-[#4C7294]" />
              <span className="truncate font-mono text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                Live Website Preview
              </span>
            </div>

            {/* Device toggles */}
            <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-900 dark:bg-zinc-950">
              {[
                { id: "desktop", icon: Monitor, label: "Desktop" },
                { id: "tablet", icon: Tablet, label: "Tablet" },
                { id: "mobile", icon: Smartphone, label: "Mobile" },
              ].map((d) => {
                const DevIcon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={`rounded-md p-1.5 transition-all ${
                      device === d.id
                        ? "border border-[#4C7294]/20 bg-[#4C7294]/15 text-[#4C7294]"
                        : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                    }`}
                    title={d.label}
                  >
                    <DevIcon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* The canvas workspace — renders the LIVE website UI directly.
              No code, no file tree. Just the visual, editable website. */}
          <div className="lume-canvas-grid relative flex flex-1 items-start justify-center overflow-y-auto p-4">
            <Motion.div
              animate={{ maxWidth: deviceWidth }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="lume-glow-frame relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-900/40"
              style={{ maxWidth: deviceWidth }}
            >
              {device !== "desktop" && (
                <div className="flex h-8 items-center justify-between border-b border-border bg-muted/40 px-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                </div>
              )}

              {/* The actual live website UI, rendered + editable in-place */}
              <Canvas
                pageData={pageData}
                editable
                selectedId={selectedSectionId}
                onSelect={handleSelect}
                device={device}
                className="min-h-full"
              />
            </Motion.div>
          </div>
        </main>

        {/* COLUMN 3: RIGHT — inspector / properties */}
        <aside className="hidden h-full w-[280px] shrink-0 flex-col overflow-hidden border-l border-zinc-200 bg-zinc-100/50 transition-colors duration-500 dark:border-zinc-900 dark:bg-[#09090A] lg:flex">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-900/80">
            <MousePointerClick className="h-3.5 w-3.5 text-[#4C7294]" />
            <span className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
              Inspector
            </span>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
            {selectedSection && selectedEntry ? (
              <Motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Selected section header */}
                <div className="rounded-xl border border-[#4C7294]/30 bg-[#4C7294]/5 p-3">
                  <div className="flex items-center gap-2">
                    <selectedEntry.icon className="h-4 w-4 text-[#4C7294]" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {selectedEntry.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {selectedEntry.description}
                  </p>
                </div>

                {/* Section metadata */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Metadata
                  </h4>
                  <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-white p-2.5 font-mono text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-400">type</span>
                      <span className="truncate text-[#4C7294]">
                        {selectedSection.type}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-400">id</span>
                      <span className="truncate text-zinc-500">
                        {selectedSection.id?.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        handleMoveSection(selectedSection.id, "up")
                      }
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <ArrowUp className="h-3 w-3" /> Up
                    </button>
                    <button
                      onClick={() =>
                        handleMoveSection(selectedSection.id, "down")
                      }
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <ArrowDown className="h-3 w-3" /> Down
                    </button>
                    <button
                      onClick={() => handleDuplicateSection(selectedSection.id)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <Copy className="h-3 w-3" /> Duplicate
                    </button>
                    <button
                      onClick={() => handleRemoveSection(selectedSection.id)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-2 py-2 text-[10px] font-semibold text-red-500 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>

                {/* Raw props preview (read-only, for transparency) */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Section Data
                  </h4>
                  <pre className="custom-scrollbar max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-950 p-2.5 font-mono text-[9px] leading-relaxed text-zinc-300 dark:border-zinc-800">
                    {JSON.stringify(selectedSection, null, 2)}
                  </pre>
                </div>
              </Motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
                <Sparkles className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Click any section in the canvas to inspect and manage it.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── MOBILE SECTION BAR (compact) ────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 border-t border-zinc-200 bg-zinc-50 p-2 md:hidden dark:border-zinc-900 dark:bg-[#0E0E10]">
        <span className="px-2 text-[10px] font-mono text-zinc-400">
          {sections.length} blocks
        </span>
        <div className="flex flex-1 items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-900 dark:bg-zinc-950">
          {[
            { id: "desktop", icon: Monitor },
            { id: "tablet", icon: Tablet },
            { id: "mobile", icon: Smartphone },
          ].map((d) => {
            const DevIcon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`flex-1 rounded-md p-1.5 transition-all ${
                  device === d.id
                    ? "bg-[#4C7294]/15 text-[#4C7294]"
                    : "text-zinc-400"
                }`}
              >
                <DevIcon className="mx-auto h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        <AddSectionMenu onAdd={handleAddSection} disabled={false} />
      </div>
    </div>
  );
}

export default VisualCanvasEditor;
