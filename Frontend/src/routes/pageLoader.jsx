import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LumePremiumLoader({ onComplete, isLoading }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Controlled mode — isLoading prop is explicitly provided
    if (isLoading !== undefined) {
      if (!isLoading) {
        // Loading complete — fast finish to 100% then exit
        setProgress(100);
        const t = setTimeout(() => setIsDone(true), 400);
        return () => clearTimeout(t);
      }

      // Loading in progress — simulate progress up to 90% and hold
      const intervalTime = 25;
      const maxProgress = 90;
      const duration = 3000;
      const increment = maxProgress / (duration / intervalTime);
      let currentProgress = 0;

      const timer = setInterval(() => {
        currentProgress = Math.min(currentProgress + increment, maxProgress);
        setProgress(Math.floor(currentProgress));
        if (currentProgress >= maxProgress) {
          clearInterval(timer);
        }
      }, intervalTime);

      return () => clearInterval(timer);
    }

    // Uncontrolled mode (original behavior) — for HydrateFallback / fallbackElement
    const duration = 3000; // 3 seconds luxury progression
    const intervalTime = 25;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(
        Math.floor((currentStep / steps) * 100),
        100,
      );

      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsDone(true);
        }, 400); // Holding delay taake user 100% dekh sake
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Characters split transition for "LUME" branding
  const brandingLetters = ["L", "U", "M", "E"];

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!isDone && (
        <div className="fixed inset-0 z-[9999] flex overflow-hidden font-sans select-none bg-black pointer-events-none">
          {/* 📐 Premium Aesthetic Grid Lines (Lume UI Theme) */}
          <div className="absolute inset-0 flex justify-between px-[15%] opacity-[0.04] pointer-events-none z-10">
            <div className="w-[1px] h-full bg-white" />
            <div className="w-[1px] h-full bg-white" />
            <div className="w-[1px] h-full bg-white" />
          </div>

          {/* Left Split Panel */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 1.4, ease: [0.85, 0, 0.15, 1] }}
            className="w-1/2 h-full bg-[#070707] border-r border-white/[0.03] pointer-events-auto"
          />

          {/* Right Split Panel */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 1.4, ease: [0.85, 0, 0.15, 1] }}
            className="w-1/2 h-full bg-[#070707] pointer-events-auto"
          />

          {/* 💎 Center Content Layout */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-16 text-white z-20 pointer-events-auto">
            {/* Top Section: Luxury Staggered Branding */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex items-center gap-1 tracking-[0.8em] text-[11px] uppercase text-[#737373] font-light"
            >
              {brandingLetters.map((letter, idx) => (
                <motion.span
                  key={idx}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    delay: idx * 0.2,
                  }}
                >
                  {letter}
                </motion.span>
              ))}
              <span className="ml-2 text-[#404040]">.AI</span>
            </motion.div>

            {/* Middle Section: Minimalist Counter & Subtle Circular Ring */}
            <div className="relative flex items-center justify-center w-64 h-64">
              {/* Ultra faint spinning background asset */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-white/[0.02] rounded-full"
              />

              <motion.div
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center"
              >
                {/* Status Subtitle */}
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#525252] mb-2 font-mono">
                  SYS_INIT
                </span>

                {/* Big Editorial Counter */}
                <div className="h-[7vw] flex items-center justify-center overflow-hidden">
                  <span className="text-[6vw] font-extralight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e5e5e5] to-[#404040]">
                    {progress.toString().padStart(3, "0")}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Section: Engine Info & Golden Accent Status */}
            <motion.div
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Premium Progress Bar (Ultra thin 1px) */}
              <div className="w-40 h-[1px] bg-white/[0.05] relative overflow-hidden mb-1">
                <motion.div
                  className="absolute h-full left-0 top-0 bg-gradient-to-r from-transparent via-[#cca43b] to-transparent"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>

              <div className="flex items-center gap-2.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cca43b] opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#cca43b]"></span>
                </span>
                <p className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#737373]">
                  {progress < 40
                    ? "Configuring Sandbox..."
                    : progress < 80
                      ? "Compiling WebContainer..."
                      : "Launching Canvas..."}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
