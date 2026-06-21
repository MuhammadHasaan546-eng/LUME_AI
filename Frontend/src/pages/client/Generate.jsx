import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Sliders,
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
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateWebsite } from "@/api/generateWebsite";

const GeneratePage = () => {
  const navigate = useNavigate();

  // State variables for form parameters
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState("web-app");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState("desktop"); // desktop, tablet, mobile
  const [activeTab, setActiveTab] = useState("preview"); // preview, code
  const [copied, setCopied] = useState(false);

  // Handle generation action - NOW CONNECTED TO REAL BACKEND
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedOutput(null);
    setError(null);

    try {
      const response = await generateWebsite(prompt.trim());
      console.log("Backend response:", response);

      // The backend returns: { statusCode, data: { message, code }, message, success }
      const data = response.data;
      if (data && data.code) {
        setGeneratedOutput({
          message: data.message || "Website generated successfully!",
          code: data.code,
        });
      } else if (typeof data === "string") {
        // In case the API returns the AI response directly
        try {
          const parsed = JSON.parse(data);
          setGeneratedOutput({
            message: parsed.message || "Website generated successfully!",
            code: parsed.code,
          });
        } catch {
          setGeneratedOutput({
            message: "Website generated!",
            code: data,
          });
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.message || "Failed to generate website. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!generatedOutput?.code) return;
    try {
      await navigator.clipboard.writeText(generatedOutput.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy code");
    }
  };

  // Download HTML file
  const handleDownload = () => {
    if (!generatedOutput?.code) return;
    const blob = new Blob([generatedOutput.code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lume-generated-website.html";
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
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 font-sans flex flex-col selection:bg-[#4C7294]/30">
      {/* 1. BRANDED HEADER */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0A0A0A] px-4 py-3.5 flex items-center justify-between border-b border-zinc-900 sticky top-0 z-20"
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -4, backgroundColor: "#18181b" }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-400 p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wider uppercase text-white bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Lume<span className="text-[#4C7294]">.ai</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-gray-500">AI Generation Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-[#4C7294] animate-pulse" />
          <span className="text-zinc-400 font-mono text-[11px]">
            LUME_CORE_NODE
          </span>
        </div>
      </motion.header>

      {/* 2. MAIN WORKSPACE ENGINE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT SIDE: Configuration Parameters Inputs */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-[#0c0c0c] overflow-y-auto space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
            <Sliders className="w-4 h-4 text-[#4C7294]" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-300">
              Generation Parameters
            </h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Project Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Project Archetype
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "web-app",
                    label: "Web Platform",
                    desc: "React SPAs & Dashboards",
                  },
                  {
                    id: "mobile-ui",
                    label: "Mobile Stack",
                    desc: "Native Responsive UI Layouts",
                  },
                ].map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setProjectType(type.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      projectType === type.id
                        ? "border-[#4C7294] bg-[#4C7294]/5 text-white shadow-[0_0_15px_rgba(76,114,148,0.15)]"
                        : "border-zinc-800 bg-[#0A0A0A] hover:border-zinc-700 text-gray-400"
                    }`}
                  >
                    <p className="text-xs font-bold">{type.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {type.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Textarea Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Describe Target Blueprint
              </label>
              <div className="relative">
                <textarea
                  rows="4"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell Lume what to build, e.g., An analytics control matrix dashboard with 3 column statistical items and nested profile sidebar navigation..."
                  className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl p-3.5 text-sm text-gray-200 placeholder-zinc-600 focus:outline-none focus:border-[#4C7294] focus:ring-1 focus:ring-[#4C7294]/30 resize-none transition-all"
                />
                <Sparkles className="absolute right-3.5 bottom-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </div>

            {/* Trigger Button */}
            <motion.button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              whileHover={{ scale: !prompt.trim() ? 1 : 1.01 }}
              whileTap={{ scale: !prompt.trim() ? 1 : 0.99 }}
              className={`w-full font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${
                !prompt.trim()
                  ? "bg-zinc-800/40 text-zinc-600 cursor-not-allowed border border-zinc-900"
                  : "bg-[#4C7294] hover:bg-[#426482] text-white"
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Lume Core Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Generate with Lume.ai
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* RIGHT SIDE: Interactive Preview Screen Canvas */}
        <div className="lg:col-span-7 bg-[#0A0A0A] p-6 flex flex-col overflow-y-auto">
          {/* Tab Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900 mb-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "preview"
                    ? "bg-[#4C7294]/10 text-[#4C7294] border border-[#4C7294]/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "code"
                    ? "bg-[#4C7294]/10 text-[#4C7294] border border-[#4C7294]/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Code className="w-3.5 h-3.5 inline mr-1.5" />
                Code
              </button>
            </div>

            {/* Preview Mode Toggle (only when preview is active and output exists) */}
            {activeTab === "preview" && generatedOutput && (
              <div className="flex items-center gap-1 bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded transition-all ${
                    previewMode === "desktop"
                      ? "bg-[#4C7294] text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Desktop view"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode("tablet")}
                  className={`p-1.5 rounded transition-all ${
                    previewMode === "tablet"
                      ? "bg-[#4C7294] text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Tablet view"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded transition-all ${
                    previewMode === "mobile"
                      ? "bg-[#4C7294] text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Mobile view"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center min-h-[350px]">
            <AnimatePresence mode="wait">
              {/* STATE 1: Empty Screen state */}
              {!isGenerating && !generatedOutput && !error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center max-w-sm space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner text-zinc-500">
                    <Code className="w-5 h-5" />
                  </div>
                  <h3 className="text-zinc-300 font-medium text-sm">
                    Lume Engine Initialized
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Adjust configurations on the left parameters panel and feed
                    prompt keywords to extract code blocks.
                  </p>
                </motion.div>
              )}

              {/* STATE 2: Loading State */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-[#4C7294]/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-t-[#4C7294] rounded-full animate-spin" />
                    <Sparkles className="w-5 h-5 text-[#4C7294] animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-mono tracking-wider text-zinc-300">
                      Lume Assembling Blueprints...
                    </p>
                    <p className="text-[11px] text-zinc-600 font-mono">
                      Communicating with AI engine
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STATE 3: Error State */}
              {!isGenerating && error && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="text-center max-w-md space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-red-400 font-medium text-sm">
                      Generation Failed
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 font-mono">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-[#4C7294] hover:underline"
                  >
                    Dismiss & try again
                  </button>
                </motion.div>
              )}

              {/* STATE 4: Success - Preview Tab */}
              {!isGenerating && generatedOutput && activeTab === "preview" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full flex flex-col items-center gap-3"
                >
                  {/* Success message */}
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/5 border border-green-500/10 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {generatedOutput.message}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-xs bg-[#4C7294] hover:bg-[#426482] text-white px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download HTML
                    </button>
                  </div>

                  {/* Preview iframe with responsive width */}
                  <div
                    className="w-full border border-zinc-800 rounded-xl overflow-hidden bg-white shadow-2xl transition-all duration-300"
                    style={{
                      maxWidth: previewWidths[previewMode],
                      height: "500px",
                    }}
                  >
                    <iframe
                      srcDoc={generatedOutput.code}
                      title="Website Preview"
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full h-full border-0"
                      style={{ minHeight: "500px" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* STATE 5: Success - Code Tab */}
              {!isGenerating && generatedOutput && activeTab === "code" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {generatedOutput.message}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? "Copied!" : "Copy Code"}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs bg-[#4C7294] hover:bg-[#426482] text-white px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#0c0c0c] border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 py-2 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      <span className="text-xs font-mono text-zinc-500 ml-2">
                        index.html
                      </span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-zinc-400 overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
                      <code>{generatedOutput.code}</code>
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center text-[10px] text-zinc-700 font-mono border-t border-zinc-900 pt-4 mt-4">
            Connected to Lume.ai backend —{" "}
            {generatedOutput ? "Live generation active" : "Ready for input"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
