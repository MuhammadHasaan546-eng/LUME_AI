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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const GeneratePage = () => {
  const navigate = useNavigate();

  // State variables for form parameters
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState("web-app");
  const [creativity, setCreativity] = useState(70);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);

  // Handle generation action
  const handleGenerate = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedOutput(null);

    // Simulate Lume.ai context compilation
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedOutput({
        title: "Dynamic Analytics Interface",
        framework: projectType === "web-app" ? "React + Vite" : "React Native",
        components: [
          "Sidebar Navigation",
          "Metric Grid Cards",
          "Framer Canvas Wrapper",
        ],
        linesOfCode: "~450 lines structural markup",
      });
    }, 2200);
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

            {/* Range Slider for Engine weights */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Creativity Weight</span>
                <span className="text-[#4C7294] font-mono">{creativity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={creativity}
                onChange={(e) => setCreativity(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#4C7294]"
              />
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
        <div className="lg:col-span-7 bg-[#0A0A0A] p-6 flex flex-col justify-between overflow-y-auto">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-900 mb-6">
            <Eye className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
              Live Terminal Output
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* STATE 1: Empty Screen state */}
              {!isGenerating && !generatedOutput && (
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
                      Parsing token graph structural nodes
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STATE 3: Success Code Data Output */}
              {!isGenerating && generatedOutput && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="w-full max-w-xl bg-[#0c0c0c] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Card Tab Header */}
                  <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      <span className="text-xs font-mono text-zinc-500 ml-2">
                        lume_manifest.config
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#4C7294]/10 text-[#4C7294] border border-[#4C7294]/20 font-mono px-2 py-0.5 rounded">
                      {generatedOutput.framework}
                    </span>
                  </div>

                  {/* Card Content body */}
                  <div className="p-6 space-y-5">
                    <div>
                      <h4 className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                        Generated Entity
                      </h4>
                      <p className="text-lg font-bold text-gray-200 mt-0.5">
                        {generatedOutput.title}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                        Compiled Component Node Tree
                      </h4>
                      <div className="space-y-1.5">
                        {generatedOutput.components.map((comp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/40 border border-zinc-900 px-3 py-2 rounded-lg"
                          >
                            <span className="text-[#4C7294]">⚡</span> {comp}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[11px] font-mono text-zinc-600">
                      <span>LUME STATUS: SUCCESS</span>
                      <span>{generatedOutput.linesOfCode}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center text-[10px] text-zinc-700 font-mono border-t border-zinc-900 pt-4 mt-4">
            Security layer protected via Lume.ai encrypted context tokens.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
