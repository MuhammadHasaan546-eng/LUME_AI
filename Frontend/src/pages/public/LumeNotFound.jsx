import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export default function LumeNotFound() {
  const luxuryEase = [0.76, 0, 0.24, 1];

  // Luxury Mouse tracking glow pattern
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#030303] text-white flex flex-col justify-between p-8 md:p-16 font-sans relative overflow-hidden select-none group/canvas"
    >
      {/* 🌌 Dynamic Ambient Grid Backlight (Follows Mouse) */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover/canvas:opacity-100 transition duration-1000 rounded-xl z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(204, 164, 59, 0.015),
              transparent 80%
            )
          `,
        }}
      />

      {/* 📐 Structural Deconstructed Grid Lines & Technical Crosshairs */}
      <div className="absolute inset-0 flex justify-between px-[10%] md:px-[15%] opacity-[0.03] pointer-events-none z-0">
        <div className="w-[1px] h-full bg-white relative">
          <div className="absolute top-1/4 -left-1 text-[10px] font-light text-white">
            +
          </div>
        </div>

        {/* Disrupted/Offset center layout column */}
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 1.8, ease: luxuryEase }}
          className="w-[1px] h-[55%] bg-gradient-to-b from-white via-white to-transparent mt-48 relative"
        >
          <div className="absolute bottom-0 -left-1 text-[10px] font-light text-white">
            +
          </div>
        </motion.div>

        <div className="w-[1px] h-full bg-white relative">
          <div className="absolute top-2/3 -left-1 text-[10px] font-light text-white">
            +
          </div>
        </div>
      </div>

      {/* Background Technical Coordinates */}
      <div className="absolute top-1/3 left-12 opacity-[0.015] text-[10px] font-mono tracking-[0.25em] space-y-1 hidden md:block">
        <div>SECTION // INDEX_OUT_OF_BOUNDS</div>
        <div>SYS_CANVAS_RENDER_FAIL [0x992Xq1JE]</div>
      </div>

      {/* 🔹 Top Header Section */}
      <div className="w-full flex justify-between items-center z-10 relative">
        <div className="text-[10px] uppercase tracking-[0.8em] text-[#6b6b6b] font-light">
          LUME<span className="text-[#333333]">.AI</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-[#525252] uppercase tracking-[0.15em]">
          <span className="w-1 h-1 rounded-full bg-red-500/60 animate-pulse" />
          Index Disrupted
        </div>
      </div>

      {/* 🔲 Center Content: High Impact Typography */}
      <div className="my-auto flex flex-col items-center text-center z-10 relative">
        {/* Editorial Glitch-Style 404 Counter */}
        <div className="relative h-[16vw] md:h-[11vw] flex items-center justify-center overflow-hidden mb-6">
          <motion.h1
            initial={{ y: "100%", skewY: 5 }}
            animate={{ y: 0, skewY: 0 }}
            transition={{ duration: 1.4, ease: luxuryEase }}
            whileHover={{ scale: 1.02, letterSpacing: "0.05em" }}
            className="text-[15vw] md:text-[10vw] font-extralight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-[#cccccc] to-[#121212] cursor-default transition-all duration-300"
          >
            404
          </motion.h1>
        </div>

        {/* Minimal Subtitle */}
        <div className="flex flex-col items-center gap-3 mb-14">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.3 }}
            className="h-[1px] w-8 bg-white"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-white max-w-xs md:max-w-lg font-light leading-relaxed"
          >
            The interface blueprint has been shifted or cache layer is void.
          </motion.p>
        </div>

        {/* Premium Action Button with Border Fill Hover effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <a
            href="/dashboard"
            className="relative inline-flex items-center gap-5 group border border-white/[0.06] bg-transparent hover:border-white px-10 py-4 rounded-md text-[10px] uppercase tracking-[0.25em] font-light transition-all duration-500"
          >
            <span className="w-1 h-1 rounded-full bg-[#cca43b] group-hover:scale-[2] transition-transform duration-300" />
            Re-route to Canvas
          </a>
        </motion.div>
      </div>

      {/* 🔹 Bottom Status Footer */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-[#444444] text-[9px] font-mono tracking-widest z-10 relative border-t border-white/[0.02] pt-6">
        <div className="flex items-center gap-2">
          <span>CORE_V1.0.5</span>
          <span className="text-[#222]">//</span>
          <span>ANTIGRAVITY_IDE</span>
        </div>
        <div className="uppercase opacity-80">
          © {new Date().getFullYear()} Lume Architecture. System Registry.
        </div>
      </div>
    </div>
  );
}
