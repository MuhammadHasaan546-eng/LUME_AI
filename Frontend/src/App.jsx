import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppRouter } from "./routes/AppRouter";

// WebContainer boot stages — mirrors the project's sandbox workflow
const BOOT_STAGES = [
  "Initializing Lume Runtime...",
  "Configuring Sandbox...",
  "Mounting Virtual Filesystem...",
  "Compiling WebContainer...",
  "Booting V8 Isolation Context...",
  "Launching Canvas...",
];

/**
 * Premium animated intro overlay.
 * Plays once when the site opens, then reveals the app underneath.
 */
const IntroOverlay = ({ onEnter }) => {
  const letters = ["L", "u", "m", "e"];
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  // WebContainer boot stage + progress simulation
  useEffect(() => {
    const totalDuration = 4500;
    const intervalTime = 40;
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const pct = Math.min(Math.floor((currentStep / steps) * 100), 100);
      setProgress(pct);

      // Advance boot stage based on progress thresholds
      const newStage = Math.min(
        Math.floor((pct / 100) * BOOT_STAGES.length),
        BOOT_STAGES.length - 1,
      );
      setStageIndex(newStage);

      if (pct >= 100) {
        clearInterval(timer);
        if (!completedRef.current) {
          completedRef.current = true;
          setTimeout(() => onEnter(), 500);
        }
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onEnter]);

  // Soft floating gradient orbs for depth
  const orbs = [
    {
      size: 340,
      color: "rgba(124, 58, 237, 0.30)",
      left: "12%",
      top: "18%",
      delay: 0,
    },
    {
      size: 280,
      color: "rgba(59, 130, 246, 0.26)",
      left: "68%",
      top: "22%",
      delay: 1.2,
    },
    {
      size: 240,
      color: "rgba(204, 164, 59, 0.20)",
      left: "30%",
      top: "62%",
      delay: 0.6,
    },
    {
      size: 200,
      color: "rgba(236, 72, 153, 0.22)",
      left: "72%",
      top: "68%",
      delay: 1.8,
    },
  ];

  // Rising particles for a lively, "feel-good" ambiance
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 6 + 7,
        delay: Math.random() * 6,
      })),
    [],
  );

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#060608] select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
      transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
    >
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 lume-mesh-bg opacity-70" />

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[90px]"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            left: orb.left,
            top: orb.top,
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.55, 1, 0.55] }}
          transition={{
            duration: 9 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Rising particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: `${p.left}%`,
            bottom: "-12px",
            width: p.size,
            height: p.size,
          }}
          animate={{ y: ["0vh", "-110vh"], opacity: [0, 1, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)]" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8 text-[10px] uppercase tracking-[0.5em] text-white/40 font-light"
        >
          AI-Native Website Builder
        </motion.span>

        {/* Logo with staggered 3D letter reveal */}
        <h1 className="flex text-7xl md:text-9xl font-black tracking-tighter mb-6">
          {letters.map((l, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: 0.6 + i * 0.12,
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(124,58,237,0.45)]"
            >
              {l}
            </motion.span>
          ))}
        </h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="text-lg md:text-xl text-white/60 max-w-md mb-12 leading-relaxed"
        >
          Describe it. Watch the magic happen.
          <br />
          <span className="text-white/40">
            Build the future with a single prompt.
          </span>
        </motion.p>

        {/* Enter button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.6, ease: "backOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={onEnter}
          className="px-10 py-4 rounded-full bg-white text-black font-bold text-sm tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.30)] hover:shadow-[0_0_60px_rgba(168,85,247,0.60)] transition-shadow"
        >
          Enter Lume →
        </motion.button>

        {/* Skip */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.6 }}
          onClick={onEnter}
          className="mt-8 text-xs uppercase tracking-[0.3em] text-white/30 hover:text-white/70 transition-colors"
        >
          Skip Intro
        </motion.button>
      </div>

      {/* WebContainer boot status + progress */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cca43b] opacity-50" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#cca43b]" />
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={stageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] uppercase tracking-[0.3em] font-mono text-white/50"
            >
              {BOOT_STAGES[stageIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Ultra-thin progress track */}
        <div className="w-56 h-[2px] bg-white/[0.06] relative overflow-hidden rounded-full">
          <motion.div
            className="absolute h-full left-0 top-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>

        <span className="text-[9px] font-mono text-white/30 tracking-widest">
          {progress.toString().padStart(3, "0")}%
        </span>
      </div>
    </motion.div>
  );
};

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  const handleEnter = () => setShowIntro(false);

  // Safety fallback: ensure intro dismisses even if boot loop stalls
  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => setShowIntro(false), 6000);
    return () => clearTimeout(timer);
  }, [showIntro]);

  return (
    <>
      <AppRouter />
      <AnimatePresence>
        {showIntro && <IntroOverlay onEnter={handleEnter} />}
      </AnimatePresence>
    </>
  );
};

export default App;
