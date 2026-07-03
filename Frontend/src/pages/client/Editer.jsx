import React, { useState, useEffect, useRef } from "react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
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
  Sun,
  Moon,
  MessageSquare,
  Columns,
  Rocket,
  Laptop,
  Folder,
  FileCode,
  FileText,
  ChevronDown,
  Trash2,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { deployWebsite, getWebsiteById, updateWebsite } from "@/api/website";
import { setThemePreference } from "@/store/theme";
import useWebContainer from "@/hooks/useWebContainer";
import { defaultHtmlTemplate } from "@/templates/defaultTemplate";

const MotionButton = framerMotion.button;
const MotionDiv = framerMotion.div;

const EditorPage = () => {
  const navigate = useNavigate();
  const { codeId } = useParams();
  const dispatch = useDispatch();
  const chatEndRef = useRef(null);
  const { isLoading, latestCode, currentWebsite } = useSelector(
    (state) => state.website,
  );
  const { selectedTheme, resolvedTheme } = useSelector((state) => state.theme);
  const isDark = resolvedTheme === "dark";
  // Core Data States
  const [code, setCode] = useState(latestCode || defaultHtmlTemplate);
  const [prompt, setPrompt] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop"); // desktop, tablet, mobile
  const [copied, setCopied] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  // Sidebar Left Navigation
  const [activeSidebarTab, setActiveSidebarTab] = useState("ai"); // ai, layers, terminal

  // Desktop Focus View Mode
  const [desktopFocusView, setDesktopFocusView] = useState("split");

  // Mobile Display View Toggle
  const [mobileActiveView, setMobileActiveView] = useState("editor");

  // WebContainer-powered live preview (gracefully degrades to a srcDoc
  // sandbox when the runtime is unavailable, and wraps React/Next component
  // code in a runnable preview document instead of rendering it as raw HTML.
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

  // Interactive terminal input state.
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef(null);
  const [expandedFolders, setExpandedFolders] = useState({ ".": true });

  // Sync state with background data stream
  useEffect(() => {
    if (!latestCode) return undefined;
    const syncCode = window.setTimeout(() => setCode(latestCode), 0);
    return () => window.clearTimeout(syncCode);
  }, [latestCode]);

  // Surface only non-recoverable WebContainer errors as toasts. Recoverable
  // errors (referrer / API key) silently fall back to sandbox preview.
  useEffect(() => {
    if (wcError && !wcFallback) {
      toast.error(wcError);
    }
  }, [wcError, wcFallback]);

  useEffect(() => {
    if (!codeId) return;

    dispatch(getWebsiteById(codeId))
      .unwrap()
      .catch((err) => {
        toast.error(err || "Failed to load website workspace.");
      });
  }, [codeId, dispatch]);

  // AI Prompt Stream Iteration
  const handleIterativeGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !codeId) return;

    try {
      const response = await dispatch(
        updateWebsite({ websiteId: codeId, prompt: prompt.trim() }),
      ).unwrap();
      toast.success(response.message || "Canvas layout synchronized!");
      setPrompt("");

      setDesktopFocusView("preview");
      if (window.innerWidth < 1024) {
        setMobileActiveView("preview");
      }
    } catch (err) {
      toast.error(err || "Iterative generation failed.");
    }
  };

  const handleRunCode = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      toast.success("Sandbox engine refreshed smoothly.");
      setDesktopFocusView("preview");
      if (window.innerWidth < 1024) {
        setMobileActiveView("preview");
      }
    }, 800);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code clipboard copy verified.");
    } catch {
      toast.error("Failed to copy matrix source.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lume-studio-build.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeploy = async () => {
    if (!codeId) return;

    try {
      const response = await dispatch(
        deployWebsite({ websiteId: codeId, code }),
      ).unwrap();
      const liveUrl = response.data?.deployedUrl || `/live-site/${codeId}`;
      toast.success(response.message || "Website deployed successfully.");
      navigate(liveUrl.replace(window.location.origin, ""));
    } catch (err) {
      toast.error(err || "Deploy failed. Please try again.");
    }
  };

  const previewWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const conversations = currentWebsite?.conversations || [];

  const stripCodeFence = (value = "") =>
    String(value)
      .trim()
      .replace(/^```(?:html|jsx?|tsx?|typescript|javascript|json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

  const getFirstFencedCodeBlock = (value = "") => {
    const match = String(value).match(
      /```(?:html|jsx?|tsx?|typescript|javascript|json)?\s*([\s\S]*?)\s*```/i,
    );
    return match?.[1] ? match[1].trim() : "";
  };

  const sliceToRenderableCode = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return "";

    const startPatterns = [
      /<!doctype\s+html/i,
      /<html[\s>]/i,
      /["']use client["'];?/i,
      /import\s+[^;]+\s+from\s+["'][^"']+["'];?/i,
      /export\s+default\s+(?:function\s+)?[A-Z][\w]*/,
      /(?:function|const|let|var|class)\s+[A-Z][\w]*/,
      /<([A-Z][\w]*|[a-z]+)[\s/>]/,
    ];

    const starts = startPatterns
      .map((pattern) => source.search(pattern))
      .filter((index) => index >= 0);
    if (!starts.length) return source;

    let sliced = source.slice(Math.min(...starts)).trim();
    const endMarkers = ["</html>", "export default", ");", "};", "}"];
    const htmlEnd = sliced.toLowerCase().lastIndexOf("</html>");
    if (htmlEnd >= 0) return sliced.slice(0, htmlEnd + "</html>".length).trim();

    const narrativeStart = sliced.search(
      /\n\s*(?:Now\b|Next\b|Then\b|Here(?:'s| is)\b|This\b|Explanation\b|Note\b|We need\b|I\b|The code\b)/i,
    );
    if (narrativeStart > 0) {
      const beforeNarrative = sliced.slice(0, narrativeStart).trim();
      if (endMarkers.some((marker) => beforeNarrative.endsWith(marker))) {
        sliced = beforeNarrative;
      }
    }

    return sliced.trim();
  };

  const isHtmlDocument = (value = "") =>
    /<!doctype html>|<html[\s>]/i.test(value);

  const isReactComponentSource = (value = "") => {
    const source = String(value || "");
    return (
      /from\s+["']react["']|from\s+["']lucide-react["']/i.test(source) ||
      /export\s+default\s+(function\s+)?[A-Z][\w]*/.test(source) ||
      /(?:function|const)\s+[A-Z][\w]*\s*(?:=|\()/.test(source) ||
      /\bclassName\s*=|\bon[A-Z][A-Za-z]+\s*=|<>/.test(source)
    );
  };

  const isHtmlLike = (value = "") =>
    isHtmlDocument(value) ||
    (!isReactComponentSource(value) &&
      /<(head|body|main|section|div|script|style|nav|header|footer)[\s>]/i.test(
        value,
      ));

  const getEditorLanguage = (value = "") => {
    const source = extractRenderableCode(value);
    if (isHtmlLike(source)) return "html";
    if (
      /import\s+type|interface\s+\w+|type\s+\w+\s*=|:\s*[A-Za-z][\w<>[\], |]*(?=[,)=;])/.test(
        source,
      )
    ) {
      return "typescript";
    }
    return "javascript";
  };

  const buildComponentPreviewDocument = (source = "") => {
    const lucideBindings = [];
    const lucideImportRegex =
      /import\s*{([^}]+)}\s*from\s*["']lucide-react["'];?/g;
    let match;

    while ((match = lucideImportRegex.exec(source)) !== null) {
      match[1]
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .forEach((name) => {
          const [imported, alias] = name
            .split(/\s+as\s+/i)
            .map((part) => part.trim());
          lucideBindings.push(alias ? `${imported}: ${alias}` : imported);
        });
    }

    const componentName =
      source.match(/export\s+default\s+function\s+([A-Z][\w]*)/)?.[1] ||
      source.match(/function\s+([A-Z][\w]*)\s*\(/)?.[1] ||
      source.match(/const\s+([A-Z][\w]*)\s*[:=]/)?.[1] ||
      source.match(/export\s+default\s+([A-Z][\w]*)/)?.[1] ||
      "PreviewComponent";

    const reactImportToBinding = (_all, hooks = "") => {
      const hookNames = hooks
        .split(",")
        .map((hook) => hook.trim())
        .filter(Boolean);
      return hookNames.length
        ? `const { ${hookNames.join(", ")} } = React;`
        : "";
    };

    let executableCode = sliceToRenderableCode(source)
      .replace(/^\s*["']use client["'];?\s*/m, "")
      .replace(/<!doctype html>[\s\S]*?<body[^>]*>/i, "")
      .replace(/<\/?(?:html|head|body)[^>]*>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(lucideImportRegex, "")
      .replace(
        /import\s+React(?:\s*,\s*{([^}]+)})?\s+from\s*["']react["'];?/g,
        reactImportToBinding,
      )
      .replace(
        /import\s*{([^}]+)}\s*from\s*["']react["'];?/g,
        reactImportToBinding,
      )
      .replace(/import\s+[^;]+;?/g, "")
      .replace(/export\s+default\s+function\s+/, "function ")
      .replace(/export\s+default\s+([A-Z][\w]*);?/g, "")
      .replace(/export\s+{[^}]+};?/g, "")
      .replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ")
      .replace(
        /(?:^|\n)\s*(?:Now\b|Next\b|Then\b|Here(?:'s| is)\b|This\b|Explanation\b|Note\b|We need\b|I\b|The code\b)[^\n]*(?:\n|$)[\s\S]*$/i,
        "",
      )
      .replace(/<\/script/gi, "<\\/script")
      .trim();

    if (
      !new RegExp(`(?:function|const|class)\\s+${componentName}\\b`).test(
        executableCode,
      )
    ) {
      executableCode += `\nconst ${componentName} = () => <div className="min-h-screen grid place-items-center bg-neutral-950 text-white">Preview component not found.</div>;`;
    }

    const lucideBinding = lucideBindings.length
      ? `const { ${lucideBindings.join(", ")} } = window.lucideReact || {};`
      : "";

    const babelSource = [
      "const { useEffect, useMemo, useRef, useState, useCallback } = React;",
      lucideBinding,
      executableCode,
      `ReactDOM.createRoot(document.getElementById("root")).render(<${componentName} />);`,
    ]
      .filter(Boolean)
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="about:srcdoc" />
    <title>Lume React Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin="anonymous" src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin="anonymous" src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script crossorigin="anonymous" src="https://unpkg.com/lucide-react@0.321.0/dist/umd/lucide-react.js"></script>
    <script crossorigin="anonymous" src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>body{margin:0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;}#root{min-height:100vh;}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-presets="env,react,typescript">${babelSource}</script>
  </body>
</html>`;
  };

  const extractRenderableCode = (value = "") => {
    let source = getFirstFencedCodeBlock(value) || stripCodeFence(value);
    if (!source) return "";

    for (let depth = 0; depth < 3; depth += 1) {
      const candidate = source.trim();
      if (!candidate || !/^(?:["'{[])/.test(candidate)) break;

      try {
        const parsed = JSON.parse(candidate);
        const nextSource =
          typeof parsed === "string"
            ? parsed
            : parsed?.code || parsed?.html || parsed?.component;

        if (
          typeof nextSource !== "string" ||
          nextSource.trim() === source.trim()
        ) {
          break;
        }

        source = stripCodeFence(nextSource);
      } catch {
        break;
      }
    }

    if (!source.includes("\n") && /\\n|\\t|\\"|\\'/.test(source)) {
      source = source
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
    }

    source = sliceToRenderableCode(stripCodeFence(source));

    const htmlStart = source.search(/<!doctype html>|<html[\s>]/i);
    if (htmlStart !== -1) {
      const htmlEnd = source.toLowerCase().lastIndexOf("</html>");
      return htmlEnd !== -1
        ? source.slice(htmlStart, htmlEnd + "</html>".length).trim()
        : source.slice(htmlStart).trim();
    }

    return source.trim();
  };

  const buildPreviewDocument = (value = "") => {
    const source = extractRenderableCode(value);
    if (!source.trim()) return defaultHtmlTemplate;
    if (isReactComponentSource(source) || !isHtmlLike(source)) {
      return buildComponentPreviewDocument(source);
    }

    const sandboxGuard = `
<base href="about:srcdoc" />
<script>
  (function () {
    function preventUnsafeNavigation(event) {
      var target = event.target;
      var link = target && target.closest ? target.closest('a[href]') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (!href || href === '#' || href.charAt(0) === '#') return;
      event.preventDefault();
    }

    document.addEventListener('click', preventUnsafeNavigation, true);
    document.addEventListener('submit', function (event) {
      event.preventDefault();
    }, true);
  })();
</script>`;

    if (/<head[\s>]/i.test(source)) {
      return source.replace(/<head([^>]*)>/i, `<head$1>${sandboxGuard}`);
    }

    if (/<body[\s>]/i.test(source)) {
      return source.replace(
        /<body([^>]*)>/i,
        `<head>${sandboxGuard}</head><body$1>`,
      );
    }

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${sandboxGuard}
  </head>
  <body>
    ${source}
  </body>
</html>`;
  };

  const cleanEditorCode = extractRenderableCode(code);
  const previewCode = buildPreviewDocument(code);
  const editorLanguage = getEditorLanguage(code);
  const activePreviewUrl =
    !wcFallback && wcStatus === "running" && wcPreviewUrl
      ? wcPreviewUrl
      : undefined;
  const iframeSrcDoc = activePreviewUrl ? undefined : previewCode;

  // Boot the WebContainer after previewCode is initialized.
  useEffect(() => {
    if (previewCode && wcStatus === "idle") {
      bootWebContainer(previewCode);
    }
  }, [previewCode, wcStatus, bootWebContainer]);

  // Debounced live-update: write the runnable preview document to the container.
  useEffect(() => {
    if (wcFallback || wcStatus !== "running" || !previewCode) return;
    const debounce = setTimeout(() => {
      updateWebContainerPreview(previewCode);
    }, 600);
    return () => clearTimeout(debounce);
  }, [previewCode, wcStatus, wcFallback, updateWebContainerPreview]);

  const handleThemeChange = (theme) => {
    dispatch(setThemePreference(theme));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations.length]);

  // Auto-scroll the terminal to the bottom whenever new output arrives.
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wcTerminalLines.length]);

  // Run a terminal command typed by the user. Splits the raw input into
  // a command + args array and delegates to the WebContainer spawn API.
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const raw = terminalInput.trim();
    if (!raw || wcCommandRunning || wcFallback) return;

    const parts = raw.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    runWcCommand(command, args);
    setTerminalInput("");
  };

  // Toggle a folder's expanded state in the file tree sidebar.
  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Pick the right icon for a file based on its extension.
  const getFileIcon = (name) => {
    if (name.endsWith(".html"))
      return <FileCode className="w-3 h-3 text-orange-500" />;
    if (name.endsWith(".js"))
      return <FileCode className="w-3 h-3 text-yellow-500" />;
    if (name.endsWith(".json"))
      return <FileCode className="w-3 h-3 text-emerald-500" />;
    if (name.endsWith(".css"))
      return <FileCode className="w-3 h-3 text-blue-500" />;
    return <FileText className="w-3 h-3 text-zinc-400" />;
  };

  // Recursively render the WebContainer file tree.
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
              className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
              style={{ paddingLeft: `${indent + 4}px` }}
            >
              <ChevronDown
                className={`w-3 h-3 text-zinc-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
              />
              <Folder className="w-3 h-3 text-[#4C7294]" />
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 truncate">
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
          className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors cursor-default"
          style={{ paddingLeft: `${indent + 20}px` }}
        >
          {getFileIcon(node.name)}
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
            {node.name}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="h-screen w-full transition-colors duration-500 bg-background text-foreground font-sans flex flex-col overflow-hidden selection:bg-primary/20 antialiased">
      {/* 1. PREMIUM HEADER ACCENTS */}
      <header className="lume-header-accent lume-glass h-14 min-h-[56px] bg-background/60 px-6 flex items-center justify-between border-b border-border/40 sticky top-0 z-50 transition-all duration-300">
        {/* LEFT ACCENTS: BACK NAVIGATION & VIEW SWITCHERS */}
        <div className="flex items-center gap-4">
          <MotionButton
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.03, x: -1 }}
            whileTap={{ scale: 0.97 }}
            className="p-2 rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/80 hover:border-primary/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </MotionButton>

          <div className="h-4 w-[1px] bg-border/60 hidden sm:block" />

          {/* Elegant View Segmented Controls */}
          <div className="hidden lg:flex items-center gap-0.5 bg-muted/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setDesktopFocusView("code")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                desktopFocusView === "code"
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Source Code
            </button>
            <button
              onClick={() => setDesktopFocusView("split")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                desktopFocusView === "split"
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Split View
            </button>
            <button
              onClick={() => setDesktopFocusView("preview")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                desktopFocusView === "preview"
                  ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Website
            </button>
          </div>

          <span className="text-xs font-semibold text-foreground tracking-wide max-w-[140px] sm:max-w-none truncate lg:hidden">
            {currentWebsite?.title || "Luxury Live Editor"}
          </span>
        </div>

        {/* RIGHT ACCENTS: TOOLBAR UTILITIES */}
        <div className="flex items-center gap-2.5">
          {/* Micro Theme Switcher Panel */}
          <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`p-1.5 rounded-lg transition-all ${
                selectedTheme === "light"
                  ? "bg-background text-primary shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`p-1.5 rounded-lg transition-all ${
                selectedTheme === "dark"
                  ? "bg-background text-primary shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("system")}
              className={`p-1.5 rounded-lg transition-all ${
                selectedTheme === "system"
                  ? "bg-background text-primary shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="System theme"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Run Code Action */}
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1.5 text-xs font-semibold bg-muted/40 border border-border/60 hover:border-primary/30 text-foreground px-3.5 py-2 rounded-xl transition-all shadow-sm hover:bg-muted/80"
          >
            <Play
              className={`w-3 h-3 text-emerald-500 fill-emerald-500/20 ${isCompiling ? "animate-pulse" : ""}`}
            />
            <span className="hidden xs:inline">Run Code</span>
          </button>

          {/* Copy Action */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs font-semibold bg-muted/40 border border-border/60 hover:border-zinc-400 text-foreground px-3.5 py-2 rounded-xl transition-all shadow-sm hover:bg-muted/80"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500 stroke-[3]" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="hidden xs:inline">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>

          {/* NEW: Premium Deploy Action (Gradient Text & Italic) */}
          <button
            onClick={handleDeploy}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold bg-muted/30 border border-purple-500/30 hover:border-pink-500/60 px-3.5 py-2 rounded-xl transition-all shadow-sm hover:bg-muted/60 hover:shadow-[0_0_15px_-3px_rgba(236,72,153,0.2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Rocket
              className={`w-3.5 h-3.5 text-purple-400 stroke-[2.5] ${isLoading ? "animate-pulse" : ""}`}
            />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic tracking-wide">
              {isLoading ? "Deploying" : "Deploy"}
            </span>
          </button>

          {/* Export Build Button (Luxury Highlight) */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl transition-all shadow-[0_4px_20px_-4px_rgba(76,114,148,0.3)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] border border-primary/20 active:scale-[0.98]"
          >
            <Download className="w-3 h-3 stroke-[2.5]" />
            <span className="hidden sm:inline">Export Build</span>
            <span className="sm:hidden inline">Export</span>
          </button>
        </div>
      </header>

      {/* LUXURIOUS MOBILE BOTTOM RAILS TABS SWAPPER */}
      <div className="lume-glass flex lg:hidden bg-background/60 border-b border-border/40 p-2 gap-2 z-20 shrink-0 transition-all duration-300">
        {/* AI COPILOT TABS BUTTON */}
        <button
          onClick={() => setMobileActiveView("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 border ${
            mobileActiveView === "chat"
              ? "bg-background text-foreground shadow-sm border-border/80"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <MessageSquare
            className={`w-3.5 h-3.5 transition-colors ${
              mobileActiveView === "chat"
                ? "text-[#B94AF4] fill-[#B94AF4]/10"
                : "text-muted-foreground"
            }`}
          />
          AI Copilot
        </button>

        {/* SOURCE LAYOUT TABS BUTTON */}
        <button
          onClick={() => setMobileActiveView("editor")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 border ${
            mobileActiveView === "editor"
              ? "bg-background text-foreground shadow-sm border-border/80"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <Code
            className={`w-3.5 h-3.5 ${
              mobileActiveView === "editor"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          />
          Source Layout
        </button>

        {/* CANVAS LIVE TABS BUTTON */}
        <button
          onClick={() => setMobileActiveView("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border ${
            mobileActiveView === "preview"
              ? "bg-primary/10 text-primary border-primary/20"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <Eye
            className={`w-3.5 h-3.5 ${
              mobileActiveView === "preview"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          />
          Canvas Live
        </button>
      </div>

      {/* 2. THE MULTI-MODE STUDIO ENGINE */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* COLUMN 1: LEFT SIDEBAR PANEL (INCREASED WIDTH FRAME) */}
        <div
          className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-zinc-100/50 dark:bg-[#09090A] border-r border-zinc-200 dark:border-zinc-900 flex overflow-hidden h-full transition-colors duration-500 ${
            mobileActiveView === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Internal Icons Strip Rail */}
          <div className="w-12 border-r border-zinc-200/60 dark:border-zinc-900/60 bg-zinc-100 dark:bg-[#070708] flex flex-col items-center py-4 gap-4 shrink-0 transition-colors">
            {[
              { id: "ai", icon: Sparkles, label: "Lume AI Copilot" },
              { id: "layers", icon: Layers, label: "Project Files" },
              { id: "terminal", icon: Terminal, label: "Terminal" },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSidebarTab(tab.id)}
                  className="p-2 rounded-lg transition-all relative group"
                  title={tab.label}
                >
                  <IconComp
                    className={`w-4 h-4 ${activeSidebarTab === tab.id ? "text-[#4C7294]" : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"}`}
                  />
                  {activeSidebarTab === tab.id && (
                    <MotionDiv
                      layoutId="leftRailInd"
                      className="absolute left-0 w-[2px] h-4 bg-[#4C7294] top-1/2 -translate-y-1/2"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Content Window */}
          <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
            <AnimatePresence mode="wait">
              {activeSidebarTab === "ai" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900/60 pb-2 mb-3 shrink-0">
                    <span className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#4C7294]" /> Lume
                      AI Copilot
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                      Iterative Engine
                    </span>
                  </div>

                  {/* Messages Bubble Frame */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-xs">
                    {conversations.length > 0 ? (
                      <>
                        {conversations.map((message, idx) => {
                          const isUser = message.role === "user";
                          return (
                            <div
                              key={message._id || idx}
                              className={`flex gap-2 w-full ${isUser ? "justify-end" : "justify-start"}`}
                            >
                              {!isUser && (
                                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#4C7294]/20 bg-[#4C7294]/5 text-[#4C7294] dark:text-[#7DA6C8]">
                                  <Sparkles className="h-2.5 w-2.5" />
                                </div>
                              )}
                              <div
                                className={`max-w-[85%] rounded-xl px-3 py-2 border shadow-sm ${
                                  isUser
                                    ? "rounded-tr-none border-[#4C7294]/20 bg-[#4C7294] text-white"
                                    : "rounded-tl-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isUser ? "text-zinc-200" : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent "}`}
                                >
                                  {isUser ? "You" : "Lume AI"}
                                </p>
                                <p className="leading-relaxed break-words font-sans">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800/80 rounded-xl p-4 text-center bg-zinc-50 dark:bg-zinc-950/20">
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Ask Lume AI to adjust design nodes dynamically.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prompt Form */}
                  <form
                    onSubmit={handleIterativeGenerate}
                    className="mt-3 relative rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0E0E10] p-1.5 focus-within:border-[#4C7294]/60 transition-colors shrink-0 shadow-sm"
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
                      className="block w-full resize-none bg-transparent pl-1 pr-10 text-xs leading-5 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none custom-scrollbar"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !prompt.trim()}
                      className="absolute bottom-2 right-2 p-1.5 rounded-md bg-[#4C7294]/10 hover:bg-[#4C7294] text-[#4C7294] hover:text-white transition-all disabled:opacity-20"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  </form>
                </MotionDiv>
              )}

              {activeSidebarTab === "layers" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900/60 pb-2 mb-3 shrink-0">
                    <span className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#4C7294]" /> Project
                      Files
                    </span>
                    <button
                      onClick={refreshWcFileTree}
                      disabled={wcFallback || wcStatus !== "running"}
                      title="Refresh file tree"
                      className="p-1 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>

                  {wcFallback ? (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800/80 rounded-xl p-4 text-center bg-zinc-50 dark:bg-zinc-950/20">
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                        File tree unavailable in sandbox mode.
                        <br />
                        WebContainer runtime required.
                      </p>
                    </div>
                  ) : wcFileTree && wcFileTree.length > 0 ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {renderFileTree(wcFileTree)}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                    </div>
                  )}

                  {wcFileTree && wcFileTree.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900/60 mt-2 shrink-0 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                      {wcFileTree.length} root item
                      {wcFileTree.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </MotionDiv>
              )}

              {activeSidebarTab === "terminal" && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900/60 pb-2 mb-2 shrink-0">
                    <span className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#4C7294]" />{" "}
                      Terminal
                    </span>
                    <button
                      onClick={clearWcTerminal}
                      disabled={wcFallback}
                      title="Clear terminal"
                      className="p-1 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>

                  {wcFallback ? (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800/80 rounded-xl p-4 text-center bg-zinc-50 dark:bg-zinc-950/20">
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                        Terminal unavailable in sandbox mode.
                        <br />
                        WebContainer runtime required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950/80 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-zinc-900/60 p-2 font-mono text-[11px] space-y-0.5">
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
                        className="mt-2 flex items-center gap-1.5 shrink-0"
                      >
                        <span className="text-emerald-500 font-mono text-[11px]">
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
                          className="flex-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#4C7294]/60 transition-colors disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={
                            !terminalInput.trim() ||
                            wcCommandRunning ||
                            wcFallback
                          }
                          className="p-1.5 rounded-md bg-[#4C7294]/10 hover:bg-[#4C7294] text-[#4C7294] hover:text-white transition-all disabled:opacity-20"
                        >
                          {wcCommandRunning ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
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

        {/* COLUMN 2: CENTER EDITOR PANEL (NO HORIZONTAL SCROLLBAR / WORD-WRAP CONFIG) */}
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-[#0C0C0C] border-r border-zinc-200 dark:border-zinc-900 h-full overflow-hidden min-w-0 transition-colors duration-500 ${
            mobileActiveView === "editor" ? "flex" : "hidden lg:flex"
          } ${desktopFocusView === "preview" ? "lg:hidden" : "flex"}`}
        >
          {/* Editor Header */}
          <div className="h-10 min-h-[40px] bg-zinc-50 dark:bg-[#0E0E10] border-b border-zinc-200 dark:border-zinc-900/80 px-4 flex items-center justify-between shrink-0 transition-colors">
            <div className="flex items-center gap-2 truncate">
              <Code className="w-3.5 h-3.5 text-[#4C7294]" />
              <span className="text-xs font-mono tracking-wide text-zinc-500 dark:text-zinc-400 truncate">
                {isHtmlDocument(code)
                  ? "source_matrix/index.html"
                  : "source_matrix/app.jsx"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-wider pr-2 hidden sm:inline">
              {isHtmlDocument(code)
                ? "HTML5 / Tailwind CDN"
                : "React / Next Component"}
            </span>
          </div>

          {/* Core Code Area - Wrapped to prevent horizontal scrolls */}
          <div className="flex-1 relative overflow-hidden bg-zinc-50/30 dark:bg-[#0A0A0B]">
            <Editor
              height="100%"
              language={editorLanguage}
              theme={isDark ? "vs-dark" : "light"}
              value={cleanEditorCode}
              onChange={(value) => setCode(value || "")}
              loading={
                <div className="flex h-full items-center justify-center text-xs font-mono text-zinc-400 dark:text-zinc-600">
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
          </div>
        </div>

        {/* COLUMN 3: RIGHT SANDBOX PREVIEW */}
        <div
          className={`shrink-0 bg-zinc-50 dark:bg-[#090909] p-4 flex flex-col overflow-hidden h-full transition-colors duration-500 ${
            mobileActiveView === "preview" ? "flex" : "hidden lg:flex"
          } ${desktopFocusView === "code" ? "lg:hidden" : "flex"} ${
            desktopFocusView === "split"
              ? "lg:w-[420px] xl:w-[500px]"
              : "lg:flex-1"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-900 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
                Live Sandbox Viewport
              </span>
            </div>

            {/* Responsive Toggles */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-900">
                {[
                  { id: "desktop", icon: Monitor, label: "Desktop Grid" },
                  { id: "tablet", icon: Tablet, label: "Tablet Mode" },
                  { id: "mobile", icon: Smartphone, label: "Mobile Scope" },
                ].map((device) => {
                  const DevIcon = device.icon;
                  return (
                    <button
                      key={device.id}
                      onClick={() => setPreviewMode(device.id)}
                      className={`p-1.5 rounded-md transition-all ${
                        previewMode === device.id
                          ? "bg-[#4C7294]/15 text-[#4C7294] border border-[#4C7294]/20"
                          : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
                      }`}
                      title={device.label}
                    >
                      <DevIcon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sandbox Wrapper Frame */}
          <div className="lume-canvas-grid flex-1 flex items-center justify-center overflow-hidden bg-zinc-200/50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-900/60 p-1 relative">
            <AnimatePresence>
              {(isCompiling ||
                isLoading ||
                wcStatus === "booting" ||
                wcStatus === "mounting") && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2.5"
                >
                  <RefreshCw className="w-4 h-4 text-[#4C7294] animate-spin" />
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tracking-wider">
                    {wcStatus === "booting" &&
                      "Booting WebContainer runtime..."}
                    {wcStatus === "mounting" &&
                      "Mounting project filesystem..."}
                    {(isCompiling ||
                      (isLoading &&
                        wcStatus !== "booting" &&
                        wcStatus !== "mounting")) &&
                      "Syncing Document Sandbox Nodes..."}
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
              className="lume-glow-frame h-full bg-white rounded-lg shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-900/40 relative w-full"
            >
              {previewMode !== "desktop" && (
                <div className="h-10 border-b border-border bg-muted/40 px-4 flex items-center justify-between">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                </div>
              )}
              <iframe
                key={
                  activePreviewUrl ? "webcontainer-preview" : "srcdoc-preview"
                }
                src={activePreviewUrl}
                srcDoc={iframeSrcDoc}
                title="Lume Production Sandbox Engine"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                className="w-full h-full bg-white border-0"
              />
              {wcFallback && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 backdrop-blur-sm">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  Sandbox Preview
                </div>
              )}
            </MotionDiv>
          </div>

          {/* Footer Engine Status */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-600 pt-3 border-t border-zinc-200 dark:border-zinc-900/60 mt-4 shrink-0">
            <span className="flex items-center gap-1">
              <span
                className={`lume-status-pulse w-1.5 h-1.5 rounded-full ${
                  wcStatus === "running"
                    ? "bg-emerald-500"
                    : wcStatus === "error"
                      ? "bg-red-500"
                      : wcStatus === "sandbox"
                        ? "bg-sky-500"
                        : "bg-amber-500"
                }`}
              />{" "}
              ENGINE: {wcFallback ? "SANDBOX" : wcStatus.toUpperCase()}
            </span>
            <span className="hidden xs:inline">
              {activePreviewUrl
                ? isHtmlLike(cleanEditorCode)
                  ? "Live HTML Runtime"
                  : "Live React Runtime"
                : wcFallback
                  ? isHtmlLike(cleanEditorCode)
                    ? "Sandboxed HTML Preview"
                    : "Sandboxed React Preview"
                  : "Sandboxed Execution Node"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
