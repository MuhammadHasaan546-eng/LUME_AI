import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Eye,
  Code,
  Zap,
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
  Maximize2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { getWebsiteById, updateWebsite } from "@/api/website";

const EditorPage = () => {
  const navigate = useNavigate();
  const { codeId } = useParams();
  const dispatch = useDispatch();
  const { isLoading, latestCode } = useSelector((state) => state.website);

  // States
  const [code, setCode] = useState(
    latestCode || "<!-- Write or generate your layout here -->",
  );
  const [prompt, setPrompt] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop"); // desktop, tablet, mobile
  const [copied, setCopied] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState("ai"); // ai, layers, terminal

  // Sync with redux state if code changes via background generation
  useEffect(() => {
    if (latestCode) {
      setCode(latestCode);
    }
  }, [latestCode]);

  useEffect(() => {
    if (!codeId) return;

    dispatch(getWebsiteById(codeId))
      .unwrap()
      .catch((err) => {
        toast.error(err || "Failed to load website.");
      });
  }, [codeId, dispatch]);

  // Handle AI iterative generation inside editor
  const handleIterativeGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !codeId) return;

    try {
      const response = await dispatch(
        updateWebsite({ websiteId: codeId, prompt: prompt.trim() }),
      ).unwrap();
      toast.success(response.message || "Layout updated successfully!");
      setPrompt("");
    } catch (err) {
      toast.error(err || "Failed to update layout.");
    }
  };

  // Live Refresh Canvas manual simulation
  const handleRunCode = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      toast.success("Canvas updated smoothly.");
    }, 800);
  };

  // Copy code utility
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  // Download code utility
  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lume-editor-build.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  return (
    <div className="h-screen bg-[#0A0A0A] text-gray-100 font-sans flex flex-col overflow-hidden selection:bg-[#4C7294]/30">
      {/* 1. PREMIUM UTILITY HEADER */}
      <header className="h-14 bg-[#0A0A0A] px-4 flex items-center justify-between border-b border-zinc-900/80 z-20">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -3, backgroundColor: "#141417" }}
            whileTap={{ scale: 0.97 }}
            className="text-gray-400 p-2 rounded-lg border border-zinc-900 bg-[#0C0C0C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          <div className="h-4 w-[1px] bg-zinc-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">
                Workspace /
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                Live Studio Editor
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunCode}
            disabled={isCompiling}
            className="flex items-center gap-1.5 text-xs bg-zinc-950 border border-zinc-800 hover:border-[#4C7294]/40 text-zinc-300 px-3 py-1.5 rounded-lg transition-all"
          >
            <Play
              className={`w-3 h-3 text-emerald-400 ${isCompiling ? "animate-pulse" : ""}`}
            />
            Run Code
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs bg-[#4C7294] hover:bg-[#426482] text-white px-3 py-1.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(76,114,148,0.1)]"
          >
            <Download className="w-3 h-3" />
            Export Build
          </button>
        </div>
      </header>

      {/* 2. SPLIT LAYOUT ENGINE WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: INTERACTIVE RAILS & CODE EDITOR (6/12 Columns) */}
        <div className="lg:col-span-6 flex bg-[#0C0C0C] border-r border-zinc-900/80 overflow-hidden">
          {/* Vertical Icon Control Tab Rail */}
          <div className="w-12 border-r border-zinc-900/60 bg-[#090909] flex flex-col items-center py-4 gap-4">
            {[
              { id: "ai", icon: Sparkles, label: "Lume AI Copilot" },
              { id: "layers", icon: Layers, label: "DOM Architecture" },
              { id: "terminal", icon: Terminal, label: "Compiler Logs" },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSidebarTab(tab.id)}
                  className={`p-2 rounded-lg transition-all relative group`}
                  title={tab.label}
                >
                  <IconComponent
                    className={`w-4 h-4 transition-colors ${
                      activeSidebarTab === tab.id
                        ? "text-[#4C7294]"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  />
                  {activeSidebarTab === tab.id && (
                    <motion.div
                      layoutId="activeRailIndicator"
                      className="absolute left-0 w-[2px] h-4 bg-[#4C7294] top-1/2 -translate-y-1/2"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Sidebar Control Panel Content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Code Editor Sub-Header */}
            <div className="h-10 bg-[#0E0E10] border-b border-zinc-900/80 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-[#4C7294]" />
                <span className="text-xs font-mono tracking-wide text-zinc-400">
                  source_matrix/index.html
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase">
                HTML / Tailwind CSS
              </span>
            </div>

            {/* Core Code Micro-Editor Input Panel */}
            <div className="flex-1 relative overflow-hidden bg-[#0A0A0B]">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent p-4 font-mono text-xs text-zinc-300 border-0 focus:outline-none focus:ring-0 resize-none overflow-y-auto leading-relaxed whitespace-pre"
                spellCheck="false"
              />
            </div>

            {/* Bottom Panel Drawer based on Left Rail Selection */}
            <div className="h-44 bg-[#09090A] border-t border-zinc-900 p-4 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeSidebarTab === "ai" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="h-full flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#4C7294]" />
                        <span className="text-xs font-semibold text-zinc-400">
                          Iterative Prompter
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">
                        Refine layout with AI
                      </span>
                    </div>

                    <form
                      onSubmit={handleIterativeGenerate}
                      className="mt-2 relative"
                    >
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Make headers uppercase and swap theme to soft emerald accents'..."
                        className="w-full bg-[#0E0E10] border border-zinc-900 rounded-lg pl-3 pr-10 py-2 text-xs text-gray-200 placeholder-zinc-600 focus:outline-none focus:border-[#4C7294]/60 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-[#4C7294]/10 hover:bg-[#4C7294] text-[#4C7294] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </form>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Lume updates the existing script fluidly on sub-prompts.
                    </p>
                  </motion.div>
                )}

                {activeSidebarTab === "layers" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-zinc-500 font-mono space-y-1 overflow-y-auto h-full"
                  >
                    <div className="text-[11px] text-zinc-400 mb-1 font-sans font-semibold">
                      Document Node Tree Preview
                    </div>
                    <div className="text-emerald-500/80">&lt;html&gt;</div>
                    <div className="pl-3 text-blue-400/80">
                      &lt;head&gt;{" "}
                      <span className="text-zinc-600">
                        // Tailwind script injected
                      </span>
                    </div>
                    <div className="pl-3 text-emerald-500/80">
                      &lt;body class="bg-black text-white"&gt;
                    </div>
                    <div className="pl-6 text-zinc-400">
                      &lt;main id="root"&gt; ... &lt;/main&gt;
                    </div>
                  </motion.div>
                )}

                {activeSidebarTab === "terminal" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[11px] text-zinc-500 space-y-1 h-full overflow-y-auto"
                  >
                    <div className="flex items-center justify-between text-zinc-600 pb-1 border-b border-zinc-900 mb-1">
                      <span>LUME CORE STANDARD LOGS</span>
                      <span>STATUS: OK</span>
                    </div>
                    <div>
                      [system] V8 isolation compilation context created.
                    </div>
                    <div>
                      [compiler] Tailwind CSS structural classes parsed
                      successfully.
                    </div>
                    <div className="text-zinc-400">
                      [success] Native sandbox rendering is active.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RE-ENGINEERED LUXURY LIVE CANVAS CANVAS (6/12 Columns) */}
        <div className="lg:col-span-6 bg-[#090909] p-6 flex flex-col overflow-hidden">
          {/* Top Control Rail for Device Previews */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400 tracking-wide">
                Live Compiled Canvas
              </span>
            </div>

            {/* Micro Responsive Device Controller Toggles */}
            <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-0.5 border border-zinc-900">
              {[
                { id: "desktop", icon: Monitor, label: "Viewport Desktop" },
                { id: "tablet", icon: Tablet, label: "Viewport Tablet" },
                { id: "mobile", icon: Smartphone, label: "Viewport Mobile" },
              ].map((device) => {
                const DeviceIcon = device.icon;
                return (
                  <button
                    key={device.id}
                    onClick={() => setPreviewMode(device.id)}
                    className={`p-1.5 rounded-md transition-all ${
                      previewMode === device.id
                        ? "bg-[#4C7294]/15 text-[#4C7294] border border-[#4C7294]/30"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                    title={device.label}
                  >
                    <DeviceIcon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Interactive Sandbox Canvas Screen */}
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-950/20 rounded-xl border border-zinc-900/60 p-2 relative group">
            {/* Compiling/Updating Overlay State Layer */}
            <AnimatePresence>
              {(isCompiling || isLoading) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5 text-[#4C7294] animate-spin" />
                  <span className="text-xs font-mono text-zinc-400 tracking-wider">
                    Syncing Sandbox Ecosystem...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actual Sandbox Responsive Render Box */}
            <motion.div
              animate={{ width: previewWidths[previewMode] }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full bg-white rounded-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden border border-zinc-900/40 relative"
            >
              {/* Optional UI frame design dots if not desktop */}
              {previewMode !== "desktop" && (
                <div className="h-6 bg-zinc-100 border-b border-zinc-200 px-3 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                </div>
              )}

              <iframe
                srcDoc={code}
                title="Lume Sandbox Playground"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full bg-white border-0"
              />
            </motion.div>
          </div>

          {/* Minimal Engine Health Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-700 pt-3 border-t border-zinc-900/60 mt-4">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              SANDBOX CORE: ALIVE
            </span>
            <span>Target Framework: Vanilla HTML5 / Tailwind CDN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
