/**
 * ============================================================================
 * CodeEditor — IDE-Style Code Workspace
 * ============================================================================
 *
 * A self-contained, presentational + behavioural component that renders a
 * full VS Code–style development interface:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  Toolbar (title · engine status · run · save · theme)        │
 *   ├────────────┬─────────────────────────────────────────────────┤
 *   │  File      │  Tabs                                            │
 *   │  Explorer  ├─────────────────────────────────────────────────┤
 *   │  (sidebar) │                                                  │
 *   │            │  Central Monaco Editor                           │
 *   │            │  (source code of the selected file)              │
 *   │            │                                                  │
 *   │            ├─────────────────────────────────────────────────┤
 *   │            │  Terminal Panel (input + streamed output)        │
 *   └────────────┴─────────────────────────────────────────────────┘
 *
 * Behaviour
 * ---------
 *   - The sidebar file explorer lists every file in the WebContainer
 *     project tree alongside a coloured file-type icon.
 *   - Clicking any file icon opens its source code in the central Monaco
 *     editor view and adds a tab to the open-files bar.
 *   - The bottom terminal panel lets the user type a command, run it inside
 *     the WebContainer, and view the streamed stdout/stderr output.
 *   - Edits in Monaco are persisted back to the WebContainer via `writeFile`
 *     (Ctrl/Cmd+S or the Save button), with a dirty-state indicator.
 *
 * It reuses the project's `useWebContainer` hook for the file system, file
 * tree, read/write, and command execution — so it works with the same
 * sandbox-fallback behaviour as the visual Editor.
 *
 * Props
 * -----
 * @param {object|null} initialPageData - PageData SSoT used to boot the
 *        WebContainer (generates a real multi-file Vite project). When null,
 *        a default project is generated.
 * @param {string}  title   - workspace title shown in the toolbar
 * @param {()=>void} onBack - optional back-navigation callback
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
import MonacoEditor from "@monaco-editor/react";
import {
  ArrowLeft,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileTerminal,
  FileImage,
  FileCog,
  FileWarning,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  X,
  Save,
  Loader2,
  Terminal,
  Play,
  Trash2,
  Send,
  PanelBottomClose,
  PanelBottomOpen,
  Circle,
  Sun,
  Moon,
  Laptop,
  Files,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import useWebContainer from "@/hooks/useWebContainer";
import { createDefaultPageData } from "@/editor/schema/pageData";
import {
  DEFAULT_FILE_TREE,
  DEFAULT_FILE_CONTENTS,
} from "@/editor/defaultProjectFiles";

const MotionDiv = framerMotion.div;

/* ======================================================================= */
/*  File-type icon + language mapping                                       */
/* ======================================================================= */

/**
 * Map a file name to a Monaco language id for syntax highlighting.
 */
function getLanguage(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jsx")) return "javascript";
  if (lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".svg")) return "xml";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  if (lower === ".npmrc" || lower.endsWith(".env")) return "ini";
  if (lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "javascript";
  return "plaintext";
}

/**
 * Return a coloured, file-type-appropriate icon for a given file name.
 * Mirrors the colour conventions of popular editors (VS Code / Material).
 */
function getFileIcon(name) {
  const lower = name.toLowerCase();

  // Config / environment files
  if (lower === ".env" || lower.startsWith(".env."))
    return <FileWarning className="h-3.5 w-3.5 text-amber-500" />;
  if (
    lower === "vite.config.js" ||
    lower === "vite.config.ts" ||
    lower === "vite.config.mjs" ||
    lower === "tailwind.config.js" ||
    lower === "postcss.config.js" ||
    lower === "jsconfig.json" ||
    lower === "eslint.config.js" ||
    lower === ".npmrc" ||
    lower === ".gitignore"
  )
    return <FileCog className="h-3.5 w-3.5 text-zinc-400" />;

  // Source / markup
  if (lower.endsWith(".html") || lower.endsWith(".htm"))
    return <FileCode className="h-3.5 w-3.5 text-orange-500" />;
  if (
    lower.endsWith(".jsx") ||
    lower.endsWith(".js") ||
    lower.endsWith(".mjs") ||
    lower.endsWith(".cjs")
  )
    return <FileCode className="h-3.5 w-3.5 text-yellow-400" />;
  if (lower.endsWith(".tsx") || lower.endsWith(".ts"))
    return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
  if (lower.endsWith(".css"))
    return <FileCode className="h-3.5 w-3.5 text-sky-400" />;
  if (lower.endsWith(".json"))
    return <FileJson className="h-3.5 w-3.5 text-emerald-400" />;
  if (lower.endsWith(".md"))
    return <FileText className="h-3.5 w-3.5 text-zinc-400" />;

  // Shell / scripts
  if (lower.endsWith(".sh") || lower.endsWith(".bash"))
    return <FileTerminal className="h-3.5 w-3.5 text-green-400" />;

  // Images
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".ico") ||
    lower.endsWith(".svg")
  )
    return <FileImage className="h-3.5 w-3.5 text-pink-400" />;

  return <FileText className="h-3.5 w-3.5 text-zinc-400" />;
}

/* ======================================================================= */
/*  File tree node                                                          */
/* ======================================================================= */

function TreeNode({
  node,
  depth,
  expandedFolders,
  toggleFolder,
  selectedFile,
  onFileClick,
}) {
  const indent = depth * 14;
  const isExpanded = expandedFolders[node.path];
  const isActive = selectedFile === node.path;

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => toggleFolder(node.path)}
          className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
          style={{ paddingLeft: `${indent + 6}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#4C7294]" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-[#4C7294]" />
          )}
          <span className="truncate font-mono text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
            {node.name}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && node.children && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => (
                <TreeNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  selectedFile={selectedFile}
                  onFileClick={onFileClick}
                />
              ))}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileClick(node)}
      className={`flex w-full cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 ${
        isActive ? "bg-[#4C7294]/10 ring-1 ring-inset ring-[#4C7294]/30" : ""
      }`}
      style={{ paddingLeft: `${indent + 22}px` }}
      title={node.path}
    >
      {getFileIcon(node.name)}
      <span
        className={`truncate font-mono text-[11px] ${
          isActive
            ? "font-semibold text-[#4C7294]"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {node.name}
      </span>
    </button>
  );
}

/* ======================================================================= */
/*  Main CodeEditor component                                               */
/* ======================================================================= */

function CodeEditor({
  initialPageData = null,
  title = "Code Workspace",
  onBack = null,
}) {
  /* ── WebContainer ─────────────────────────────────────────────────── */
  const {
    status: wcStatus,
    error: wcError,
    fallback: wcFallback,
    boot: bootWebContainer,
    fileTree: wcFileTree,
    refreshFileTree: refreshWcFileTree,
    readFile: wcReadFile,
    writeFile: wcWriteFile,
    terminalLines: wcTerminalLines,
    runCommand: runWcCommand,
    clearTerminal: clearWcTerminal,
    isCommandRunning: wcCommandRunning,
  } = useWebContainer();

  /* ── UI state ─────────────────────────────────────────────────────── */
  const [expandedFolders, setExpandedFolders] = useState({ ".": true });
  const [openTabs, setOpenTabs] = useState([]); // [{ path, name, content, original, dirty }]
  const [activeTabPath, setActiveTabPath] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [appTheme, setAppTheme] = useState("dark");
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const terminalEndRef = useRef(null);
  const terminalInputRef = useRef(null);
  const resizeRef = useRef(null);
  const bootedRef = useRef(false);

  const activeTab = useMemo(
    () => openTabs.find((t) => t.path === activeTabPath) || null,
    [openTabs, activeTabPath],
  );

  /**
   * The file tree shown in the explorer. We prefer the live WebContainer
   * tree once it is populated; otherwise we fall back to the bundled
   * default project tree so the explorer is ALWAYS visible and every file
   * is always clickable — even in sandbox mode or while booting.
   */
  const displayFileTree = useMemo(
    () =>
      wcFileTree && wcFileTree.length > 0 ? wcFileTree : DEFAULT_FILE_TREE,
    [wcFileTree],
  );

  /**
   * Whether reads/writes should go through the WebContainer. When false
   * (sandbox / booting / no container), file contents come from the
   * bundled DEFAULT_FILE_CONTENTS map.
   */
  const useLiveContainer =
    !wcFallback && wcStatus === "running" && !!wcReadFile;

  /* ── Boot the WebContainer once with a project ────────────────────── */
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const pageData = initialPageData || createDefaultPageData();
    bootWebContainer(pageData);
  }, [initialPageData, bootWebContainer]);

  // Auto-expand the top-level folders once a tree is available so the
  // user immediately sees src/, public/, etc. Works for both the live
  // WebContainer tree and the bundled default tree.
  useEffect(() => {
    if (displayFileTree && displayFileTree.length > 0) {
      setExpandedFolders((prev) => {
        const next = { ...prev, ".": true };
        displayFileTree.forEach((node) => {
          if (node.type === "directory") next[node.path] = true;
        });
        return next;
      });
    }
  }, [displayFileTree]);

  /**
   * Auto-open a default file (src/App.jsx) on first load so the central
   * editor view is never empty — the user immediately sees source code.
   */
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (!displayFileTree || displayFileTree.length === 0) return;
    autoOpenedRef.current = true;
    // Find src/App.jsx in the tree (works for both live + bundled trees).
    const findFile = (nodes, path) => {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
          const found = findFile(node.children, path);
          if (found) return found;
        }
      }
      return null;
    };
    const target =
      findFile(displayFileTree, "src/App.jsx") ||
      findFile(displayFileTree, "package.json");
    if (target) handleFileClick(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayFileTree]);

  // Surface non-recoverable WebContainer errors.
  useEffect(() => {
    if (wcError && !wcFallback) toast.error(wcError);
  }, [wcError, wcFallback]);

  // Auto-scroll terminal to bottom on new output.
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wcTerminalLines.length]);

  /* ── Folder / file handlers ───────────────────────────────────────── */
  const toggleFolder = useCallback((path) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  /**
   * Open a file: read its contents and add a tab.
   *
   * When the WebContainer is running, contents are read from the live
   * container file system. Otherwise (sandbox / booting / no container)
   * contents are pulled from the bundled DEFAULT_FILE_CONTENTS map — so
   * clicking a file ALWAYS loads its source code into the editor.
   *
   * If the file is already open, just activate its tab.
   */
  const handleFileClick = useCallback(
    async (node) => {
      // Already open → just focus.
      const existing = openTabs.find((t) => t.path === node.path);
      if (existing) {
        setActiveTabPath(node.path);
        return;
      }

      setIsLoadingFile(true);
      setActiveTabPath(node.path);

      try {
        let contents = null;

        if (useLiveContainer && wcReadFile) {
          // Live read from the WebContainer.
          contents = await wcReadFile(node.path);
        }

        // Fallback to bundled contents when the container read returned
        // nothing (not ready / sandbox / file not yet mounted).
        if (contents === null || contents === undefined) {
          contents =
            DEFAULT_FILE_CONTENTS[node.path] ??
            DEFAULT_FILE_CONTENTS[node.name] ??
            "";
        }

        const tab = {
          path: node.path,
          name: node.name,
          content: contents,
          original: contents,
          dirty: false,
        };
        setOpenTabs((prev) => [...prev, tab]);
      } catch (err) {
        toast.error(err?.message || "Failed to read file.");
        setActiveTabPath(null);
      } finally {
        setIsLoadingFile(false);
      }
    },
    [openTabs, useLiveContainer, wcReadFile],
  );

  const handleCloseTab = useCallback(
    (path, e) => {
      e?.stopPropagation();
      setOpenTabs((prev) => {
        const idx = prev.findIndex((t) => t.path === path);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.path !== path);
        if (activeTabPath === path) {
          const newActive =
            next[idx] || next[idx - 1] || next[next.length - 1] || null;
          setActiveTabPath(newActive ? newActive.path : null);
        }
        return next;
      });
    },
    [activeTabPath],
  );

  /**
   * Update the active tab's content as the user types in Monaco.
   */
  const handleEditorChange = useCallback(
    (value) => {
      if (!activeTabPath) return;
      setOpenTabs((prev) =>
        prev.map((t) =>
          t.path === activeTabPath
            ? { ...t, content: value ?? "", dirty: value !== t.original }
            : t,
        ),
      );
    },
    [activeTabPath],
  );

  /**
   * Persist the active file's contents.
   *
   * When the WebContainer is running, writes go to the live container
   * file system. Otherwise the change is committed to local tab state
   * only (sandbox / booting mode) so the editor still behaves correctly.
   */
  const handleSave = useCallback(
    async (pathToSave) => {
      const targetPath = pathToSave || activeTabPath;
      if (!targetPath) return;
      const tab = openTabs.find((t) => t.path === targetPath);
      if (!tab) return;

      setIsSaving(true);
      try {
        let ok = true;
        if (useLiveContainer && wcWriteFile) {
          ok = await wcWriteFile(targetPath, tab.content);
        }
        if (ok) {
          setOpenTabs((prev) =>
            prev.map((t) =>
              t.path === targetPath
                ? { ...t, original: t.content, dirty: false }
                : t,
            ),
          );
          toast.success(`Saved ${tab.name}`);
        } else {
          toast.error("Failed to save file to WebContainer.");
        }
      } catch (err) {
        toast.error(err?.message || "Save failed.");
      } finally {
        setIsSaving(false);
      }
    },
    [activeTabPath, openTabs, useLiveContainer, wcWriteFile],
  );

  /* ── Terminal handlers ────────────────────────────────────────────── */
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const raw = terminalInput.trim();
    if (!raw || wcCommandRunning || wcFallback) return;
    const parts = raw.split(/\s+/);
    runWcCommand(parts[0], parts.slice(1));
    setCommandHistory((prev) => [...prev, raw]);
    setHistoryIndex(-1);
    setTerminalInput("");
  };

  const handleTerminalKeyDown = (e) => {
    // Up / Down arrow → navigate command history (like a real shell).
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIdx =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIdx);
      setTerminalInput(commandHistory[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIdx = historyIndex + 1;
      if (newIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setTerminalInput("");
      } else {
        setHistoryIndex(newIdx);
        setTerminalInput(commandHistory[newIdx]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      // Ctrl+L → clear terminal (shell convention).
      e.preventDefault();
      clearWcTerminal();
    }
  };

  /* ── Terminal resize (drag handle) ────────────────────────────────── */
  useEffect(() => {
    const handle = resizeRef.current;
    if (!handle) return;

    let startY = 0;
    let startH = 0;

    const onMouseMove = (e) => {
      const delta = startY - e.clientY;
      const next = Math.min(
        Math.max(startH + delta, 90),
        window.innerHeight - 220,
      );
      setTerminalHeight(next);
    };
    const onMouseUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    const onMouseDown = (e) => {
      startY = e.clientY;
      startH = terminalHeight;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);
    return () => handle.removeEventListener("mousedown", onMouseDown);
  }, [terminalHeight]);

  /* ── Theme handling ───────────────────────────────────────────────── */
  const applyTheme = useCallback((theme) => {
    setAppTheme(theme);
    if (theme === "light") {
      setEditorTheme("vs");
      document.documentElement.classList.remove("dark");
    } else if (theme === "dark") {
      setEditorTheme("vs-dark");
      document.documentElement.classList.add("dark");
    } else {
      // system
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setEditorTheme(prefersDark ? "vs-dark" : "vs");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  useEffect(() => {
    applyTheme("dark");
  }, [applyTheme]);

  /* ── Derived ──────────────────────────────────────────────────────── */
  const isBooting =
    wcStatus === "booting" ||
    wcStatus === "mounting" ||
    wcStatus === "installing" ||
    wcStatus === "starting";

  const dirtyCount = openTabs.filter((t) => t.dirty).length;
  const lineCount = activeTab ? activeTab.content.split("\n").length : 0;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-50 font-sans text-foreground antialiased dark:bg-[#09090A]">
      {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
      <header className="lume-glass flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/70 px-4 dark:border-zinc-800 dark:bg-[#0B0B0D]/70">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#4C7294] to-[#3d5d78] text-white">
              <FileCode className="h-3.5 w-3.5" />
            </div>
            <span className="max-w-[200px] truncate text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-200">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Engine status pill */}
          <span className="hidden items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 sm:inline-flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                wcStatus === "running"
                  ? "bg-emerald-500"
                  : wcStatus === "error"
                    ? "bg-red-500"
                    : wcStatus === "sandbox"
                      ? "bg-sky-500"
                      : "animate-pulse bg-amber-500"
              }`}
            />
            {wcFallback ? "SANDBOX" : wcStatus.toUpperCase()}
          </span>

          {/* Theme switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            {[
              { id: "light", icon: Sun },
              { id: "dark", icon: Moon },
              { id: "system", icon: Laptop },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={`rounded-md p-1.5 transition-all ${
                    appTheme === t.id
                      ? "bg-white text-[#4C7294] shadow-sm dark:bg-zinc-800"
                      : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  }`}
                  title={`${t.id} theme`}
                >
                  <Icon className="h-3 w-3" />
                </button>
              );
            })}
          </div>

          {/* Save */}
          <button
            onClick={() => handleSave()}
            disabled={!activeTab || isSaving || !wcWriteFile}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save
          </button>

          {/* Run dev server hint */}
          <button
            onClick={() => {
              if (wcFallback || wcCommandRunning) return;
              runWcCommand("npm", ["run", "dev"]);
              setTerminalOpen(true);
            }}
            disabled={wcFallback || wcCommandRunning || isBooting}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400"
            title="Run npm run dev"
          >
            <Play className="h-3 w-3 fill-emerald-500/20" />
            <span className="hidden sm:inline">Run</span>
          </button>
        </div>
      </header>

      {/* ── BODY: sidebar + editor + terminal ──────────────────────── */}
      <div className="relative flex w-full flex-1 overflow-hidden">
        {/* ═══ SIDEBAR: FILE EXPLORER ═══════════════════════════════ */}
        <aside className="flex h-full w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-[#0B0B0D] xl:w-72">
          {/* Sidebar header */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-200 px-3 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Files className="h-3.5 w-3.5 text-[#4C7294]" />
              Explorer
            </span>
            <button
              onClick={refreshWcFileTree}
              disabled={wcFallback || wcStatus !== "running"}
              title="Refresh file tree"
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {/* Project name */}
          <div className="shrink-0 px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {title.toUpperCase().replace(/\s+/g, "-")}
            </span>
          </div>

          {/* Tree — always populated (live container tree or bundled default) */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-1.5 pb-2">
            {displayFileTree && displayFileTree.length > 0 ? (
              displayFileTree.map((node) => (
                <TreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  selectedFile={activeTabPath}
                  onFileClick={handleFileClick}
                />
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="shrink-0 border-t border-zinc-200 px-3 py-1.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-800">
            {displayFileTree ? displayFileTree.length : 0} root item
            {displayFileTree?.length !== 1 ? "s" : ""}
            {!useLiveContainer && (
              <span className="ml-1.5 text-amber-500/80">· sample</span>
            )}
          </div>
        </aside>

        {/* ═══ MAIN: EDITOR + TERMINAL ══════════════════════════════ */}
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-[#0E0E10]">
          {/* ── Tab bar ────────────────────────────────────────────── */}
          <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#0B0B0D]">
            <AnimatePresence>
              {openTabs.length === 0 && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center px-4 text-[11px] text-zinc-400"
                >
                  Select a file from the explorer to start editing…
                </MotionDiv>
              )}
            </AnimatePresence>

            {openTabs.map((tab) => {
              const isActive = tab.path === activeTabPath;
              return (
                <div
                  key={tab.path}
                  onClick={() => setActiveTabPath(tab.path)}
                  className={`group flex cursor-pointer items-center gap-1.5 border-r border-zinc-200 px-3 text-[11px] transition-colors dark:border-zinc-800 ${
                    isActive
                      ? "bg-white text-zinc-800 dark:bg-[#0E0E10] dark:text-zinc-100"
                      : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-[#0B0B0D] dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                  title={tab.path}
                >
                  {getFileIcon(tab.name)}
                  <span className="max-w-[120px] truncate font-mono">
                    {tab.name}
                  </span>
                  {tab.dirty && (
                    <Circle className="h-2 w-2 fill-current text-zinc-400" />
                  )}
                  <button
                    onClick={(e) => handleCloseTab(tab.path, e)}
                    className="ml-1 rounded p-0.5 text-zinc-400 opacity-0 transition-all hover:bg-zinc-200 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    title="Close tab"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4C7294]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Editor area (flexes, shrinks when terminal open) ──── */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTab ? (
              isLoadingFile ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#4C7294]" />
                    <span className="font-mono text-[11px] text-zinc-400">
                      Reading {activeTab.name}…
                    </span>
                  </div>
                </div>
              ) : (
                <MonacoEditor
                  key={activeTab.path}
                  height="100%"
                  language={getLanguage(activeTab.name)}
                  value={activeTab.content}
                  onChange={handleEditorChange}
                  theme={editorTheme}
                  loading={
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-[#4C7294]" />
                    </div>
                  }
                  options={{
                    minimap: { enabled: true, scale: 1 },
                    fontSize: 13,
                    fontFamily:
                      "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
                    fontLigatures: true,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: "all",
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    roundedSelection: true,
                    scrollbar: {
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                  }}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                    // Ctrl/Cmd+S → save active file.
                    editor.addCommand(
                      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                      () => handleSave(),
                    );
                  }}
                />
              )
            ) : (
              /* Empty-state splash */
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-[#0E0E10]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <FileCode className="h-7 w-7 text-[#4C7294]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    No file open
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-400">
                    Click any file in the explorer sidebar to view and edit its
                    source code here.
                  </p>
                </div>
                {isBooting && (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    {wcStatus === "booting" &&
                      "Booting WebContainer runtime..."}
                    {wcStatus === "mounting" &&
                      "Mounting project filesystem..."}
                    {wcStatus === "installing" &&
                      "Installing dependencies (npm install)..."}
                    {wcStatus === "starting" && "Starting Vite dev server..."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Terminal resize handle ─────────────────────────────── */}
          {terminalOpen && !wcFallback && (
            <div
              ref={resizeRef}
              className="group flex h-1.5 shrink-0 cursor-row-resize items-center justify-center bg-zinc-200 transition-colors hover:bg-[#4C7294]/40 dark:bg-zinc-800 dark:hover:bg-[#4C7294]/40"
              title="Drag to resize terminal"
            >
              <div className="h-0.5 w-8 rounded-full bg-zinc-400 group-hover:bg-[#4C7294] dark:bg-zinc-600" />
            </div>
          )}

          {/* ── Terminal panel ─────────────────────────────────────── */}
          {terminalOpen && !wcFallback && (
            <section
              className="flex shrink-0 flex-col overflow-hidden border-t border-zinc-200 bg-[#0A0A0A] dark:border-zinc-800"
              style={{ height: `${terminalHeight}px` }}
            >
              {/* Terminal header */}
              <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-[#4C7294]" />
                  <span className="font-mono text-[11px] font-semibold text-zinc-300">
                    Terminal
                  </span>
                  {wcCommandRunning && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      running
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearWcTerminal}
                    disabled={wcCommandRunning}
                    title="Clear terminal (Ctrl+L)"
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setTerminalOpen(false)}
                    title="Hide terminal"
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <PanelBottomClose className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal output */}
              <div
                className="custom-scrollbar flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
                onClick={() => terminalInputRef.current?.focus()}
              >
                {wcTerminalLines.length === 0 ? (
                  <div className="text-zinc-600">
                    $ Ready. Type a command and press Enter.
                    <span className="ml-1 text-zinc-700">
                      (e.g. ls, npm install, npm run dev)
                    </span>
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
                              : "text-zinc-300"
                      }
                    >
                      {line.type === "command" ? "$ " : ""}
                      {line.text}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal input */}
              <form
                onSubmit={handleTerminalSubmit}
                className="flex shrink-0 items-center gap-2 border-t border-zinc-800 px-3 py-2"
              >
                <span className="font-mono text-[11px] text-emerald-500">
                  $
                </span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder={
                    wcCommandRunning
                      ? "Running…"
                      : "Enter command (↑/↓ for history, Ctrl+L to clear)"
                  }
                  disabled={wcCommandRunning}
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent font-mono text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!terminalInput.trim() || wcCommandRunning}
                  className="rounded bg-[#4C7294]/10 p-1.5 text-[#4C7294] transition-all hover:bg-[#4C7294] hover:text-white disabled:opacity-20"
                  title="Run command (Enter)"
                >
                  {wcCommandRunning ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </button>
              </form>
            </section>
          )}

          {/* ── Status bar ─────────────────────────────────────────── */}
          <div className="flex h-6 shrink-0 items-center justify-between border-t border-zinc-200 bg-[#4C7294] px-3 font-mono text-[10px] text-white/90 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Hash className="h-2.5 w-2.5" />
                {activeTab
                  ? getLanguage(activeTab.name).toUpperCase()
                  : "PLAINTEXT"}
              </span>
              {activeTab && (
                <>
                  <span>Ln {lineCount}</span>
                  <span>UTF-8</span>
                  <span>Spaces: 2</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {dirtyCount > 0 && (
                <span className="text-amber-200">
                  {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
                </span>
              )}
              {!terminalOpen && !wcFallback && (
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="flex items-center gap-1 transition-colors hover:text-white"
                  title="Show terminal"
                >
                  <PanelBottomOpen className="h-3 w-3" />
                  Terminal
                </button>
              )}
              <span className="hidden sm:inline">
                {wcFallback ? "Sandbox Mode" : `Engine: ${wcStatus}`}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CodeEditor;
