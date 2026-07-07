/**
 * ============================================================================
 * Lume Editor — Reusable Visual Website Builder Component
 * ============================================================================
 *
 * This is the reusable Editor component that replaces the old `Editer.jsx`
 * page. It is a **presentational + behavioural** component that:
 *
 *   - Treats a `pageData` JSON object as the Single Source of Truth.
 *   - Lets the user reorder, add, remove, and duplicate body sections.
 *   - Renders an in-app **Canvas** (visual editor with click-to-select) in
 *     the center column.
 *   - Boots a **WebContainer** with a real multi-file Vite project generated
 *     from the same `pageData` and shows the live preview in the right column.
 *   - Falls back to a read-only Canvas preview when the WebContainer runtime
 *     is unavailable (no cross-origin isolation / missing API key).
 *   - Exposes an AI Copilot chat panel, a project file-tree, and an
 *     interactive terminal (all powered by the WebContainer).
 *
 * It is intentionally free of Redux / react-router dependencies so it can be
 * mounted anywhere. The hosting page wires data + handlers via props.
 *
 * Props
 * -----
 * @param {object|null}  initialPageData  - PageData SSoT (null while loading)
 * @param {(pd:object)=>void} onPageDataChange - fired on every edit (debounce upstream)
 * @param {string}       title             - website title for the header
 * @param {Array}        conversations     - AI chat history [{role,content,_id}]
 * @param {(prompt:string)=>Promise} onPrompt - AI iterative generation handler
 * @param {(pd:object)=>Promise}  onDeploy     - deploy handler
 * @param {()=>void}     onBack            - back navigation
 * @param {boolean}      isLoading         - AI / deploy loading flag
 * @param {string}       selectedTheme     - "light" | "dark" | "system"
 * @param {(t:string)=>void} onThemeChange - theme switch callback
 * @param {boolean}      isDark            - resolved dark-mode flag
 * ============================================================================
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  Code,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Copy,
  Check,
  Play,
  Layers,
  Terminal,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Columns,
  Rocket,
  Laptop,
  Folder,
  FileCode,
  FileText,
  Trash2,
  Send,
  Plus,
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "sonner";
import { Canvas } from "@/editor/Canvas";
import {
  createDefaultPageData,
  createDefaultSection,
  createSectionId,
  normalizePageData,
  serializePageData,
  parsePageData,
} from "@/editor/schema/pageData";
import {
  getAddableSections,
  getSectionEntry,
} from "@/editor/sections/sectionRegistry";
import useWebContainer from "@/hooks/useWebContainer";

const MotionButton = framerMotion.button;
const MotionDiv = framerMotion.div;

/* ======================================================================= */
/*  Immutable pageData update helpers                                       */
/* ======================================================================= */

/**
 * Return a new pageData object whose `sections` array has been transformed
 * by `updater`. All operations are immutable so React.memo'd section
 * components only re-render when their own props change.
 */
function updateSections(pageData, updater) {
  const next = updater(pageData.sections);
  return { ...pageData, sections: next };
}

/** Append a new default section of `type` to the sections array. */
function addSection(pageData, type) {
  const section = createDefaultSection(type);
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
    const copy = JSON.parse(JSON.stringify(sections[idx]));
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
          <MotionDiv
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
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================================================================= */
/*  Main Editor component                                                   */
/* ======================================================================= */

function Editor({
  initialPageData = null,
  onPageDataChange = null,
  title = "Untitled Project",
  conversations = [],
  onPrompt = null,
  onDeploy = null,
  onBack = null,
  isLoading = false,
  isSaving = false,
  selectedTheme = "system",
  onThemeChange = null,
  isDark = false,
}) {
  /* ── pageData state (controlled/uncontrolled) ─────────────────────── */

  const [pageData, setPageData] = useState(() =>
    initialPageData
      ? normalizePageData(initialPageData)
      : createDefaultPageData(),
  );
  const [prevInitial, setPrevInitial] = useState(initialPageData);

  // Sync from prop when the parent supplies a new pageData (e.g. after AI
  // generation or initial load). Local edits are NOT overwritten unless the
  // prop identity actually changes. Adjusting state during render (rather than
  // in an effect) avoids cascading renders — see React docs:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (initialPageData && initialPageData !== prevInitial) {
    setPrevInitial(initialPageData);
    setPageData(normalizePageData(initialPageData));
  }

  /**
   * Central mutator: applies `updater` to pageData and notifies the parent
   * via `onPageDataChange` so it can persist (debounced upstream).
   */
  const updatePageData = useCallback(
    (updater) => {
      setPageData((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (onPageDataChange) onPageDataChange(next);
        return next;
      });
    },
    [onPageDataChange],
  );

  /* ── UI state ──────────────────────────────────────────────────────── */

  const [prompt, setPrompt] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [copied, setCopied] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState("ai");
  const [desktopFocusView, setDesktopFocusView] = useState("split");
  const [mobileActiveView, setMobileActiveView] = useState("editor");
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [terminalInput, setTerminalInput] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({ ".": true });
  const [jsonDraft, setJsonDraft] = useState(null);

  const chatEndRef = useRef(null);
  const terminalEndRef = useRef(null);

  /* ── WebContainer ─────────────────────────────────────────────────── */

  const {
    status: wcStatus,
    previewUrl: wcPreviewUrl,
    error: wcError,
    fallback: wcFallback,
    boot: bootWebContainer,
    updatePreview: updateWebContainerPreview,
    fileTree: wcFileTree,
    refreshFileTree: refreshWcFileTree,
    terminalLines: wcTerminalLines,
    runCommand: runWcCommand,
    clearTerminal: clearWcTerminal,
    isCommandRunning: wcCommandRunning,
  } = useWebContainer();

  // Boot the WebContainer once pageData is ready.
  useEffect(() => {
    if (pageData && wcStatus === "idle") {
      bootWebContainer(pageData);
    }
  }, [pageData, wcStatus, bootWebContainer]);

  // Debounced hot-update: rewrite pageData.json in the container.
  useEffect(() => {
    if (wcFallback || wcStatus !== "running" || !pageData) return;
    const debounce = setTimeout(() => {
      updateWebContainerPreview(pageData);
    }, 600);
    return () => clearTimeout(debounce);
  }, [pageData, wcStatus, wcFallback, updateWebContainerPreview]);

  // Surface non-recoverable WebContainer errors.
  useEffect(() => {
    if (wcError && !wcFallback) toast.error(wcError);
  }, [wcError, wcFallback]);

  // Auto-scroll chat + terminal.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations.length]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wcTerminalLines.length]);

  /* ── Derived values ───────────────────────────────────────────────── */

  const previewWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const activePreviewUrl =
    !wcFallback && wcStatus === "running" && wcPreviewUrl
      ? wcPreviewUrl
      : undefined;

  const editorValue =
    jsonDraft !== null ? jsonDraft : serializePageData(pageData);

  const isBooting =
    wcStatus === "booting" ||
    wcStatus === "mounting" ||
    wcStatus === "installing" ||
    wcStatus === "starting";

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const handleIterativeGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !onPrompt) return;
    try {
      await onPrompt(prompt.trim());
      setPrompt("");
      setDesktopFocusView("preview");
      if (window.innerWidth < 1024) setMobileActiveView("preview");
    } catch (err) {
      toast.error(err || "Iterative generation failed.");
    }
  };

  const handleRunCode = () => {
    setIsCompiling(true);
    if (wcFallback) {
      setTimeout(() => {
        setIsCompiling(false);
        toast.success("Canvas refreshed.");
      }, 400);
    } else if (wcStatus === "running") {
      updateWebContainerPreview(pageData);
      setTimeout(() => setIsCompiling(false), 400);
    } else if (wcStatus === "idle") {
      bootWebContainer(pageData);
      setTimeout(() => setIsCompiling(false), 400);
    } else {
      setTimeout(() => setIsCompiling(false), 400);
    }
    setDesktopFocusView("preview");
    if (window.innerWidth < 1024) setMobileActiveView("preview");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(serializePageData(pageData));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Page JSON copied to clipboard.");
    } catch {
      toast.error("Failed to copy page data.");
    }
  };

  const handleDownload = () => {
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
  };

  const handleDeploy = async () => {
    if (!onDeploy) return;
    try {
      await onDeploy(pageData);
    } catch (err) {
      toast.error(err || "Deploy failed. Please try again.");
    }
  };

  const handleApplyJson = () => {
    if (!jsonDraft) return;
    try {
      const parsed = parsePageData(jsonDraft);
      updatePageData(parsed);
      setJsonDraft(null);
      toast.success("JSON applied successfully.");
    } catch (err) {
      toast.error("Invalid JSON: " + (err?.message || "parse error"));
    }
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const raw = terminalInput.trim();
    if (!raw || wcCommandRunning || wcFallback) return;
    const parts = raw.split(/\s+/);
    runWcCommand(parts[0], parts.slice(1));
    setTerminalInput("");
  };

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  /* ── Section operations ──────────────────────────────────────────── */

  const handleAddSection = useCallback(
    (type) => {
      updatePageData((pd) => addSection(pd, type));
      toast.success(`${getSectionEntry(type)?.label || type} section added.`);
    },
    [updatePageData],
  );

  const handleRemoveSection = useCallback(
    (id) => {
      updatePageData((pd) => removeSection(pd, id));
      if (selectedSectionId === id) setSelectedSectionId(null);
    },
    [updatePageData, selectedSectionId],
  );

  const handleDuplicateSection = useCallback(
    (id) => {
      updatePageData((pd) => duplicateSection(pd, id));
    },
    [updatePageData],
  );

  const handleMoveSection = useCallback(
    (id, direction) => {
      updatePageData((pd) => moveSection(pd, id, direction));
    },
    [updatePageData],
  );

  /* ── File tree rendering ─────────────────────────────────────────── */

  const getFileIcon = (name) => {
    if (name.endsWith(".html"))
      return <FileCode className="h-3 w-3 text-orange-500" />;
    if (name.endsWith(".js") || name.endsWith(".jsx"))
      return <FileCode className="h-3 w-3 text-yellow-500" />;
    if (name.endsWith(".json"))
      return <FileCode className="h-3 w-3 text-emerald-500" />;
    if (name.endsWith(".css"))
      return <FileCode className="h-3 w-3 text-blue-500" />;
    return <FileText className="h-3 w-3 text-zinc-400" />;
  };

  const renderFileTree = (nodes, depth = 0) => {
    if (!nodes || nodes.length === 0) return null;
    return nodes.map((node) => {
      const isExpanded = expandedFolders[node.path];
      const indent = depth * 12;
      if (node.type === "directory") {
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
              style={{ paddingLeft: `${indent + 4}px` }}
            >
              <ChevronDown
                className={`h-3 w-3 text-zinc-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
              />
              <Folder className="h-3 w-3 text-[#4C7294]" />
              <span className="truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                {node.name}
              </span>
            </button>
            {isExpanded && node.children && (
              <div>{renderFileTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }
      return (
        <div
          key={node.path}
          className="flex cursor-default items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
          style={{ paddingLeft: `${indent + 20}px` }}
        >
          {getFileIcon(node.name)}
          <span className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {node.name}
          </span>
        </div>
      );
    });
  };

  /* ── Loading state (pageData not yet available) ──────────────────── */

  if (!initialPageData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-[#4C7294]" />
          <span className="font-mono text-xs text-zinc-400">
            Loading workspace…
          </span>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary/20">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="lume-header-accent lume-glass sticky top-0 z-50 flex h-14 min-h-[56px] items-center justify-between border-b border-border/40 bg-background/60 px-6 transition-all duration-300">
        {/* Left: back + view switcher + title */}
        <div className="flex items-center gap-4">
          {onBack && (
            <MotionButton
              onClick={onBack}
              whileHover={{ scale: 1.03, x: -1 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-border/60 bg-muted/30 p-2 text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground hover:border-primary/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </MotionButton>
          )}

          <div className="hidden h-4 w-[1px] bg-border/60 sm:block" />

          {/* View segmented controls */}
          <div className="hidden items-center gap-0.5 rounded-xl border border-border/40 bg-muted/40 p-1 lg:flex">
            <button
              onClick={() => setDesktopFocusView("code")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                desktopFocusView === "code"
                  ? "border border-border/60 bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              JSON
            </button>
            <button
              onClick={() => setDesktopFocusView("split")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                desktopFocusView === "split"
                  ? "border border-border/60 bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              Design
            </button>
            <button
              onClick={() => setDesktopFocusView("preview")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                desktopFocusView === "preview"
                  ? "border border-primary/20 bg-primary/10 font-bold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Live
            </button>
          </div>

          <span className="max-w-[140px] truncate text-xs font-semibold tracking-wide text-foreground sm:max-w-none lg:hidden">
            {title}
          </span>
        </div>

        {/* Right: theme + actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme switcher */}
          {onThemeChange && (
            <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/20 p-1">
              {[
                { id: "light", icon: Sun },
                { id: "dark", icon: Moon },
                { id: "system", icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onThemeChange(t.id)}
                    className={`rounded-lg p-1.5 transition-all ${
                      selectedTheme === t.id
                        ? "border border-border/40 bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={`${t.id} theme`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Autosave status indicator */}
          {onPageDataChange && (
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all sm:inline-flex ${
                isSaving
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-500"
                  : "border-emerald-400/40 bg-emerald-500/10 text-emerald-500"
              }`}
              title={isSaving ? "Saving changes…" : "All changes saved"}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isSaving ? "animate-pulse bg-amber-500" : "bg-emerald-500"
                }`}
              />
              {isSaving ? "Saving" : "Saved"}
            </span>
          )}

          {/* Run */}
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted/80 hover:border-emerald-500/30"
          >
            <Play
              className={`h-3 w-3 fill-emerald-500/20 text-emerald-500 ${isCompiling ? "animate-pulse" : ""}`}
            />
            <span className="hidden xs:inline">Run</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted/80"
          >
            {copied ? (
              <Check className="h-3 w-3 stroke-[3] text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="hidden xs:inline">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>

          {/* Deploy */}
          {onDeploy && (
            <button
              onClick={handleDeploy}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-muted/30 px-3.5 py-2 text-xs font-bold shadow-sm transition-all hover:bg-muted/60 hover:border-pink-500/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Rocket
                className={`h-3.5 w-3.5 stroke-[2.5] text-purple-400 ${isLoading ? "animate-pulse" : ""}`}
              />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text italic tracking-wide text-transparent">
                {isLoading ? "Deploying" : "Deploy"}
              </span>
            </button>
          )}

          {/* Export */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-[0_4px_20px_-4px_rgba(76,114,148,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Download className="h-3 w-3 stroke-[2.5]" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* ── MOBILE TABS ─────────────────────────────────────────────── */}
      <div className="lume-glass flex shrink-0 gap-2 border-b border-border/40 bg-background/60 p-2 transition-all duration-300 lg:hidden">
        <button
          onClick={() => setMobileActiveView("chat")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
            mobileActiveView === "chat"
              ? "border-border/80 bg-background text-foreground shadow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare
            className={`h-3.5 w-3.5 ${mobileActiveView === "chat" ? "text-[#B94AF4] fill-[#B94AF4]/10" : ""}`}
          />
          AI Copilot
        </button>
        <button
          onClick={() => setMobileActiveView("editor")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
            mobileActiveView === "editor"
              ? "border-border/80 bg-background text-foreground shadow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code
            className={`h-3.5 w-3.5 ${mobileActiveView === "editor" ? "text-primary" : ""}`}
          />
          Editor
        </button>
        <button
          onClick={() => setMobileActiveView("preview")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all ${
            mobileActiveView === "preview"
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye
            className={`h-3.5 w-3.5 ${mobileActiveView === "preview" ? "text-primary" : ""}`}
          />
          Preview
        </button>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="relative flex w-full flex-1 overflow-hidden">
        {/* COLUMN 1: LEFT SIDEBAR */}
        <div
          className={`h-full w-full shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-100/50 transition-colors duration-500 dark:border-zinc-900 dark:bg-[#09090A] lg:w-[380px] xl:w-[420px] ${
            mobileActiveView === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Icon rail */}
          <div className="flex w-12 shrink-0 flex-col items-center gap-4 border-r border-zinc-200/60 bg-zinc-100 py-4 transition-colors dark:border-zinc-900/60 dark:bg-[#070708]">
            {[
              { id: "ai", icon: Sparkles, label: "Lume AI Copilot" },
              { id: "sections", icon: Layers, label: "Sections" },
              { id: "files", icon: Folder, label: "Project Files" },
              { id: "terminal", icon: Terminal, label: "Terminal" },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSidebarTab(tab.id)}
                  className="group relative rounded-lg p-2 transition-all"
                  title={tab.label}
                >
                  <IconComp
                    className={`h-4 w-4 ${activeSidebarTab === tab.id ? "text-[#4C7294]" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"}`}
                  />
                  {activeSidebarTab === tab.id && (
                    <MotionDiv
                      layoutId="leftRailInd"
                      className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-[#4C7294]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic content */}
          <div className="flex h-full flex-1 flex-col overflow-hidden p-4">
            <AnimatePresence mode="wait">
              {/* ── AI COPILOT ─────────────────────────────────────── */}
              {activeSidebarTab === "ai" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-col overflow-hidden"
                >
                  <div className="mb-3 flex shrink-0 items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-900/60">
                    <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                      <Sparkles className="h-3.5 w-3.5 text-[#4C7294]" /> Lume
                      AI Copilot
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      Iterative Engine
                    </span>
                  </div>

                  <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
                    {conversations.length > 0 ? (
                      <>
                        {conversations.map((message, idx) => {
                          const isUser = message.role === "user";
                          return (
                            <div
                              key={message._id || idx}
                              className={`flex w-full gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                            >
                              {!isUser && (
                                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#4C7294]/20 bg-[#4C7294]/5 text-[#4C7294] dark:text-[#7DA6C8]">
                                  <Sparkles className="h-2.5 w-2.5" />
                                </div>
                              )}
                              <div
                                className={`max-w-[85%] rounded-xl border px-3 py-2 shadow-sm ${
                                  isUser
                                    ? "rounded-tr-none border-[#4C7294]/20 bg-[#4C7294] text-white"
                                    : "rounded-tl-none border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                                }`}
                              >
                                <p
                                  className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${isUser ? "text-zinc-200" : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"}`}
                                >
                                  {isUser ? "You" : "Lume AI"}
                                </p>
                                <p className="break-words font-sans leading-relaxed">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Ask Lume AI to adjust your layout dynamically.
                        </p>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleIterativeGenerate}
                    className="mt-3 shrink-0 rounded-xl border border-zinc-200 bg-white p-1.5 transition-colors focus-within:border-[#4C7294]/60 dark:border-zinc-800/80 dark:bg-[#0E0E10]"
                  >
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleIterativeGenerate(e);
                        }
                      }}
                      placeholder="Ask AI to polish layout changes..."
                      rows={2}
                      className="custom-scrollbar block w-full resize-none bg-transparent pl-1 pr-10 text-xs leading-5 text-zinc-800 placeholder-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder-zinc-600"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !prompt.trim()}
                      className="absolute bottom-2 right-2 rounded-md bg-[#4C7294]/10 p-1.5 text-[#4C7294] transition-all hover:bg-[#4C7294] hover:text-white disabled:opacity-20"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                  </form>
                </MotionDiv>
              )}

              {/* ── SECTIONS (layer manager) ──────────────────────── */}
              {activeSidebarTab === "sections" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col overflow-hidden"
                >
                  <div className="mb-3 flex shrink-0 items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-900/60">
                    <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                      <Layers className="h-3.5 w-3.5 text-[#4C7294]" /> Sections
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {pageData.sections.length} block
                      {pageData.sections.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Section list */}
                  <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
                    {pageData.sections.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
                        <p className="text-[11px] text-zinc-400">
                          No sections yet. Add one below.
                        </p>
                      </div>
                    ) : (
                      pageData.sections.map((section, idx) => (
                        <SectionListItem
                          key={section.id}
                          section={section}
                          index={idx}
                          total={pageData.sections.length}
                          isSelected={selectedSectionId === section.id}
                          onSelect={() =>
                            setSelectedSectionId(
                              selectedSectionId === section.id
                                ? null
                                : section.id,
                            )
                          }
                          onMoveUp={() => handleMoveSection(section.id, "up")}
                          onMoveDown={() =>
                            handleMoveSection(section.id, "down")
                          }
                          onDuplicate={() => handleDuplicateSection(section.id)}
                          onDelete={() => handleRemoveSection(section.id)}
                        />
                      ))
                    )}
                  </div>

                  {/* Add section */}
                  <div className="mt-3 shrink-0 border-t border-zinc-200 pt-3 dark:border-zinc-900/60">
                    <AddSectionMenu onAdd={handleAddSection} disabled={false} />
                  </div>
                </MotionDiv>
              )}

              {/* ── PROJECT FILES ─────────────────────────────────── */}
              {activeSidebarTab === "files" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col overflow-hidden"
                >
                  <div className="mb-3 flex shrink-0 items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-900/60">
                    <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                      <Folder className="h-3.5 w-3.5 text-[#4C7294]" /> Project
                      Files
                    </span>
                    <button
                      onClick={refreshWcFileTree}
                      disabled={wcFallback || wcStatus !== "running"}
                      title="Refresh file tree"
                      className="rounded-md p-1 transition-colors hover:bg-zinc-200/60 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800/60"
                    >
                      <RefreshCw className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>

                  {wcFallback ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
                      <p className="text-[11px] leading-relaxed text-zinc-400">
                        File tree unavailable in sandbox mode.
                        <br />
                        WebContainer runtime required.
                      </p>
                    </div>
                  ) : wcFileTree && wcFileTree.length > 0 ? (
                    <div className="custom-scrollbar flex-1 overflow-y-auto">
                      {renderFileTree(wcFileTree)}
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-zinc-400" />
                    </div>
                  )}

                  {wcFileTree && wcFileTree.length > 0 && (
                    <div className="mt-2 shrink-0 border-t border-zinc-200 pt-2 font-mono text-[10px] text-zinc-400 dark:border-zinc-900/60">
                      {wcFileTree.length} root item
                      {wcFileTree.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </MotionDiv>
              )}

              {/* ── TERMINAL ──────────────────────────────────────── */}
              {activeSidebarTab === "terminal" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col overflow-hidden"
                >
                  <div className="mb-2 flex shrink-0 items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-900/60">
                    <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                      <Terminal className="h-3.5 w-3.5 text-[#4C7294]" />{" "}
                      Terminal
                    </span>
                    <button
                      onClick={clearWcTerminal}
                      disabled={wcFallback}
                      title="Clear terminal"
                      className="rounded-md p-1 transition-colors hover:bg-zinc-200/60 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800/60"
                    >
                      <Trash2 className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>

                  {wcFallback ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
                      <p className="text-[11px] leading-relaxed text-zinc-400">
                        Terminal unavailable in sandbox mode.
                        <br />
                        WebContainer runtime required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-950/80 p-2 font-mono text-[11px] dark:border-zinc-900/60 dark:bg-black/40">
                        {wcTerminalLines.length === 0 ? (
                          <div className="text-zinc-600 dark:text-zinc-700">
                            $ Ready. Type a command and press Enter.
                          </div>
                        ) : (
                          wcTerminalLines.map((line, idx) => (
                            <div
                              key={idx}
                              className={
                                line.type === "command"
                                  ? "text-emerald-400"
                                  : line.type === "error"
                                    ? "text-red-400"
                                    : line.type === "success"
                                      ? "text-sky-400"
                                      : "text-zinc-300 dark:text-zinc-400"
                              }
                            >
                              {line.type === "command" ? "$ " : ""}
                              {line.text}
                            </div>
                          ))
                        )}
                        <div ref={terminalEndRef} />
                      </div>

                      <form
                        onSubmit={handleTerminalSubmit}
                        className="mt-2 flex shrink-0 items-center gap-1.5"
                      >
                        <span className="font-mono text-[11px] text-emerald-500">
                          $
                        </span>
                        <input
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          placeholder={
                            wcCommandRunning
                              ? "Running..."
                              : "Enter command (e.g. ls, npm install)"
                          }
                          disabled={wcCommandRunning}
                          className="flex-1 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1.5 font-mono text-[11px] text-zinc-800 placeholder-zinc-400 transition-colors focus:border-[#4C7294]/60 focus:outline-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:placeholder-zinc-600"
                        />
                        <button
                          type="submit"
                          disabled={
                            !terminalInput.trim() ||
                            wcCommandRunning ||
                            wcFallback
                          }
                          className="rounded-md bg-[#4C7294]/10 p-1.5 text-[#4C7294] transition-all hover:bg-[#4C7294] hover:text-white disabled:opacity-20"
                        >
                          {wcCommandRunning ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 2: CENTER (Canvas design OR Monaco JSON) */}
        <div
          className={`flex h-full min-w-0 flex-1 flex-col border-r border-zinc-200 bg-white transition-colors duration-500 dark:border-zinc-900 dark:bg-[#0C0C0C] ${
            mobileActiveView === "editor" ? "flex" : "hidden lg:flex"
          } ${desktopFocusView === "preview" ? "lg:hidden" : "flex"}`}
        >
          {/* Editor header */}
          <div className="flex h-10 min-h-[40px] shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 transition-colors dark:border-zinc-900/80 dark:bg-[#0E0E10]">
            <div className="flex items-center gap-2 truncate">
              {desktopFocusView === "code" ? (
                <>
                  <Code className="h-3.5 w-3.5 text-[#4C7294]" />
                  <span className="truncate font-mono text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                    src/data/pageData.json
                  </span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 text-[#4C7294]" />
                  <span className="truncate font-mono text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                    Visual Canvas Editor
                  </span>
                </>
              )}
            </div>
            {desktopFocusView === "code" && (
              <button
                onClick={handleApplyJson}
                disabled={!jsonDraft}
                className="rounded-md bg-[#4C7294]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4C7294] transition-all hover:bg-[#4C7294] hover:text-white disabled:opacity-30"
              >
                Apply JSON
              </button>
            )}
          </div>

          {/* Content area */}
          <div className="relative flex-1 overflow-hidden bg-zinc-50/30 dark:bg-[#0A0A0B]">
            {desktopFocusView === "code" ? (
              <MonacoEditor
                height="100%"
                language="json"
                theme={isDark ? "vs-dark" : "light"}
                value={editorValue}
                onChange={(value) => setJsonDraft(value || "")}
                loading={
                  <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-400">
                    Loading Monaco editor...
                  </div>
                }
                options={{
                  automaticLayout: true,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 13,
                  lineHeight: 22,
                  minimap: { enabled: false },
                  padding: { top: 20, bottom: 20 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  wordWrap: "on",
                  wrappingIndent: "indent",
                }}
              />
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar">
                <Canvas
                  pageData={pageData}
                  editable
                  selectedId={selectedSectionId}
                  onSelect={setSelectedSectionId}
                  device={previewMode}
                  className="min-h-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: RIGHT PREVIEW */}
        <div
          className={`flex h-full shrink-0 flex-col overflow-hidden bg-zinc-50 p-4 transition-colors duration-500 dark:bg-[#090909] ${
            mobileActiveView === "preview" ? "flex" : "hidden lg:flex"
          } ${desktopFocusView === "code" ? "lg:hidden" : "flex"} ${
            desktopFocusView === "split"
              ? "lg:w-[420px] xl:w-[500px]"
              : "lg:flex-1"
          }`}
        >
          {/* Preview header */}
          <div className="mb-4 flex shrink-0 items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-900">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                Live Preview
              </span>
            </div>

            {/* Device toggles */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-900 dark:bg-zinc-950">
                {[
                  { id: "desktop", icon: Monitor, label: "Desktop" },
                  { id: "tablet", icon: Tablet, label: "Tablet" },
                  { id: "mobile", icon: Smartphone, label: "Mobile" },
                ].map((device) => {
                  const DevIcon = device.icon;
                  return (
                    <button
                      key={device.id}
                      onClick={() => setPreviewMode(device.id)}
                      className={`rounded-md p-1.5 transition-all ${
                        previewMode === device.id
                          ? "border border-[#4C7294]/20 bg-[#4C7294]/15 text-[#4C7294]"
                          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                      }`}
                      title={device.label}
                    >
                      <DevIcon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview surface */}
          <div className="lume-canvas-grid relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200/50 p-1 dark:border-zinc-900/60 dark:bg-zinc-950/40">
            <AnimatePresence>
              {(isCompiling || isLoading || isBooting) && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-white/95 backdrop-blur-[1px] dark:bg-[#0A0A0A]/95"
                >
                  <RefreshCw className="h-4 w-4 animate-spin text-[#4C7294]" />
                  <span className="font-mono text-[11px] tracking-wider text-zinc-400">
                    {wcStatus === "booting" &&
                      "Booting WebContainer runtime..."}
                    {wcStatus === "mounting" &&
                      "Mounting project filesystem..."}
                    {wcStatus === "installing" &&
                      "Installing dependencies (npm install)..."}
                    {wcStatus === "starting" && "Starting Vite dev server..."}
                    {(isCompiling || (isLoading && !isBooting)) &&
                      "Syncing canvas nodes..."}
                  </span>
                </MotionDiv>
              )}
            </AnimatePresence>

            <MotionDiv
              animate={{
                width:
                  window.innerWidth < 1024
                    ? "100%"
                    : previewWidths[previewMode],
                maxWidth: "100%",
              }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="lume-glow-frame relative h-full w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-900/40"
            >
              {previewMode !== "desktop" && (
                <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                </div>
              )}

              {/* Live WebContainer iframe OR in-app Canvas fallback */}
              {activePreviewUrl ? (
                <iframe
                  key="webcontainer-preview"
                  src={activePreviewUrl}
                  title="Lume Live Preview"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  className="h-full w-full border-0 bg-white"
                />
              ) : (
                <div className="h-full overflow-y-auto">
                  <Canvas
                    pageData={pageData}
                    editable={false}
                    device={previewMode}
                    className="min-h-full"
                  />
                </div>
              )}

              {wcFallback && (
                <div className="absolute left-2 top-2 z-20 flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-600 backdrop-blur-sm dark:text-amber-400">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
                  Sandbox Preview
                </div>
              )}
            </MotionDiv>
          </div>

          {/* Engine status footer */}
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-zinc-200 pt-3 font-mono text-[10px] text-zinc-400 dark:border-zinc-900/60">
            <span className="flex items-center gap-1">
              <span
                className={`lume-status-pulse h-1.5 w-1.5 rounded-full ${
                  wcStatus === "running"
                    ? "bg-emerald-500"
                    : wcStatus === "error"
                      ? "bg-red-500"
                      : wcStatus === "sandbox"
                        ? "bg-sky-500"
                        : "bg-amber-500"
                }`}
              />
              ENGINE: {wcFallback ? "SANDBOX" : wcStatus.toUpperCase()}
            </span>
            <span className="hidden xs:inline">
              {activePreviewUrl
                ? "Live Vite Runtime"
                : wcFallback
                  ? "In-App Canvas Preview"
                  : "Initializing..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
