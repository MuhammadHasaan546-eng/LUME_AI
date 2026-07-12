/**
 * ============================================================================
 * FileExplorer — Interactive Project File Tree + Code Viewer
 * ============================================================================
 *
 * A self-contained, presentational component that:
 *
 *   - Renders the WebContainer project file tree (folders + files) with
 *     expand/collapse behaviour.
 *   - Wires an **onClick** handler to every file node. When a file is
 *     selected, its source code is retrieved from the WebContainer instance
 *     via the `readFile` prop and displayed in a Monaco-based code viewer
 *     pane.
 *   - Supports inline editing of file contents (persisted back to the
 *     WebContainer via the `writeFile` prop) with a dirty-state indicator.
 *   - Gracefully handles sandbox fallback mode (no WebContainer runtime).
 *
 * It is intentionally free of Redux / router dependencies and receives all
 * data + callbacks via props, mirroring the Editor.jsx pattern.
 *
 * Props
 * -----
 * @param {Array}        fileTree        - tree from useWebContainer.readFileTree()
 * @param {(p:string)=>Promise<string|null>}  readFile  - read file contents
 * @param {(p:string,c:string)=>Promise<boolean>} writeFile - persist edits
 * @param {()=>void}     refreshFileTree - refresh the tree
 * @param {boolean}      fallback        - sandbox mode flag
 * @param {string}       status          - WebContainer status
 * ============================================================================
 */
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import {
  Folder,
  FileCode,
  FileText,
  FileJson,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  X,
  Save,
  Loader2,
  FileWarning,
} from "lucide-react";

const MotionDiv = framerMotion.div;

/* ── Helpers ─────────────────────────────────────────────────────────── */

/**
 * Map a file name to a Monaco language id for syntax highlighting.
 */
function getLanguage(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jsx") || lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".tsx") || lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md")) return "markdown";
  return "plaintext";
}

/**
 * Return a coloured icon for a given file name.
 */
function getFileIcon(name) {
  if (name.endsWith(".html"))
    return <FileCode className="h-3 w-3 text-orange-500" />;
  if (name.endsWith(".js") || name.endsWith(".jsx"))
    return <FileCode className="h-3 w-3 text-yellow-500" />;
  if (name.endsWith(".json"))
    return <FileJson className="h-3 w-3 text-emerald-500" />;
  if (name.endsWith(".css"))
    return <FileCode className="h-3 w-3 text-blue-500" />;
  return <FileText className="h-3 w-3 text-zinc-400" />;
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function FileExplorer({
  fileTree,
  readFile,
  writeFile,
  refreshFileTree,
  fallback,
  status,
}) {
  const [expandedFolders, setExpandedFolders] = useState({ ".": true });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isDirty = useMemo(
    () => fileContent !== originalContent,
    [fileContent, originalContent],
  );

  const toggleFolder = useCallback((path) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  /**
   * Handle a file click — retrieve its source code from the WebContainer
   * and open the code viewer pane.
   */
  const handleFileClick = useCallback(
    async (node) => {
      if (!readFile) return;
      setSelectedFile(node.path);
      setViewerOpen(true);
      setIsLoadingFile(true);
      setLoadError(null);
      setFileContent("");
      setOriginalContent("");

      try {
        const contents = await readFile(node.path);
        if (contents === null || contents === undefined) {
          setLoadError(
            "Unable to read file. The WebContainer may not be ready.",
          );
        } else {
          setFileContent(contents);
          setOriginalContent(contents);
        }
      } catch (err) {
        setLoadError(err?.message || "Failed to read file from WebContainer.");
      } finally {
        setIsLoadingFile(false);
      }
    },
    [readFile],
  );

  /**
   * Persist the edited contents back to the WebContainer.
   */
  const handleSave = useCallback(async () => {
    if (!selectedFile || !writeFile || !isDirty) return;
    setIsSaving(true);
    try {
      const ok = await writeFile(selectedFile, fileContent);
      if (ok) {
        setOriginalContent(fileContent);
      } else {
        setLoadError("Failed to save file to WebContainer.");
      }
    } catch (err) {
      setLoadError(err?.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, writeFile, fileContent, isDirty]);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
    setSelectedFile(null);
    setFileContent("");
    setOriginalContent("");
    setLoadError(null);
  }, []);

  // Close the viewer on Escape.
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleCloseViewer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, handleCloseViewer]);

  /* ── File tree renderer ──────────────────────────────────────────── */

  const renderFileTree = (nodes, depth = 0) => {
    if (!nodes || nodes.length === 0) return null;
    return nodes.map((node) => {
      const isExpanded = expandedFolders[node.path];
      const indent = depth * 12;
      const isActive = selectedFile === node.path;

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
        <button
          key={node.path}
          onClick={() => handleFileClick(node)}
          className={`flex w-full cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 ${
            isActive ? "bg-[#4C7294]/10 ring-1 ring-[#4C7294]/30" : ""
          }`}
          style={{ paddingLeft: `${indent + 20}px` }}
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
    });
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Tree (rendered inside the sidebar) ───────────────────── */}
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-900/60">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
          <Folder className="h-3.5 w-3.5 text-[#4C7294]" /> Project Files
        </span>
        <button
          onClick={refreshFileTree}
          disabled={fallback || status !== "running"}
          title="Refresh file tree"
          className="rounded-md p-1 transition-colors hover:bg-zinc-200/60 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800/60"
        >
          <RefreshCw className="h-3 w-3 text-zinc-400" />
        </button>
      </div>

      {fallback ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            File tree unavailable in sandbox mode.
            <br />
            WebContainer runtime required.
          </p>
        </div>
      ) : fileTree && fileTree.length > 0 ? (
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {renderFileTree(fileTree)}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <RefreshCw className="h-4 w-4 animate-spin text-zinc-400" />
        </div>
      )}

      {fileTree && fileTree.length > 0 && (
        <div className="mt-2 shrink-0 border-t border-zinc-200 pt-2 font-mono text-[10px] text-zinc-400 dark:border-zinc-900/60">
          {fileTree.length} root item{fileTree.length !== 1 ? "s" : ""}
          {selectedFile && (
            <span className="mt-1 block truncate text-[#4C7294]">
              {selectedFile}
            </span>
          )}
        </div>
      )}

      {/* ── Code viewer pane (modal overlay) ─────────────────────── */}
      <AnimatePresence>
        {viewerOpen && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={handleCloseViewer}
          >
            <MotionDiv
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <div className="flex min-w-0 items-center gap-2">
                  {getFileIcon(selectedFile || "")}
                  <span className="truncate font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    {selectedFile}
                  </span>
                  {isDirty && (
                    <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      unsaved
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving || !writeFile}
                    title="Save changes (Ctrl+S)"
                    className="flex items-center gap-1 rounded-md bg-[#4C7294] px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#3d5d78] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCloseViewer}
                    title="Close (Esc)"
                    className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body — Monaco code viewer */}
              <div className="relative flex-1 overflow-hidden">
                {isLoadingFile ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#4C7294]" />
                      <span className="font-mono text-[11px] text-zinc-400">
                        Reading {selectedFile}…
                      </span>
                    </div>
                  </div>
                ) : loadError ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FileWarning className="h-6 w-6 text-red-400" />
                      <p className="max-w-sm text-[11px] leading-relaxed text-zinc-500">
                        {loadError}
                      </p>
                    </div>
                  </div>
                ) : (
                  <MonacoEditor
                    height="100%"
                    language={getLanguage(selectedFile || "")}
                    value={fileContent}
                    onChange={(val) => setFileContent(val ?? "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
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
                    }}
                    onMount={(editor, monaco) => {
                      // Ctrl/Cmd+S to save.
                      editor.addCommand(
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                        () => handleSave(),
                      );
                    }}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-4 py-1.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-800">
                <span>
                  {getLanguage(selectedFile || "").toUpperCase()} ·{" "}
                  {fileContent.split("\n").length} lines
                </span>
                <span>Esc to close · Ctrl+S to save</span>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
}
