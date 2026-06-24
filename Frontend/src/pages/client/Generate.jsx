import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { generateWebsite } from "@/api/website";
import { clearWebsiteError } from "@/store/website";

const GeneratePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.website);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    dispatch(clearWebsiteError());

    try {
      const response = await dispatch(generateWebsite(trimmedPrompt)).unwrap();
      const websiteId = response?.data?.websiteId || response?.data?._id;

      if (!websiteId) {
        throw new Error("Website generated, but website id was not returned.");
      }

      toast.success(response.message || "Website generated successfully!");
      navigate(`/editor/${websiteId}`);
    } catch (err) {
      toast.error(err?.message || err || "Failed to generate website.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground transition-colors duration-500">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -18, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[-7rem] top-16 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -24, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[-5rem] top-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full overflow-hidden rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" />

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-all duration-300 hover:border-primary/20 hover:bg-muted/70 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-6 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 shadow-sm shadow-purple-500/10">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              AI Website Generator
            </div>

            <div className="max-w-2xl space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Describe your website
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Generate your first version here. After generation, you’ll be
                redirected to the editor with the website ID so you can keep
                refining the same project.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="group relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/30 via-fuchsia-500/20 to-cyan-500/25 opacity-0 blur transition duration-300 group-focus-within:opacity-100" />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                placeholder="Example: Build a modern responsive portfolio website with home, about, services, and contact pages."
                className="relative z-10 w-full resize-none rounded-2xl border border-border/70 bg-muted/15 p-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-purple-500/40 focus:bg-muted/25 focus:ring-0"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              whileHover={{
                scale: isLoading ? 1 : 1.01,
                y: isLoading ? 0 : -1,
              }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {isLoading ? (
                <>
                  <RefreshCw className="relative z-10 h-4 w-4 animate-spin" />
                  <span className="relative z-10">Generating website...</span>
                </>
              ) : (
                <>
                  <Zap className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">
                    Generate and open editor
                  </span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default GeneratePage;
