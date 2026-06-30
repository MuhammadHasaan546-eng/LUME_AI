import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const ScrollTicker = () => {
  const containerRef = useRef(null);

  // Track scroll progress relative to this component's viewport position
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Map scroll progress to horizontal pixel values
  // Row 1 moves Left <- Right
  const xLeft = useTransform(scrollYProgress, [0, 1], [0, -600]);
  // Row 2 moves Right -> Left
  const xRight = useTransform(scrollYProgress, [0, 1], [-600, 0]);

  return (
    <section
      ref={containerRef}
      className="py-20 bg-background overflow-hidden border-b border-primary/5 select-none"
    >
      <div className="flex flex-col gap-4 max-w-full">
        {/* FIRST ROW: Tracks Left */}
        <motion.div
          style={{ x: xLeft }}
          className="flex whitespace-nowrap text-7xl md:text-9xl font-black uppercase tracking-tighter"
        >
          {Array(4)
            .fill("")
            .map((_, i) => (
              <span
                key={i}
                className="flex items-center text-muted-foreground/10"
              >
                LUME AI <span className="mx-8 text-primary/40">•</span>
                FUTURE OF WEB <span className="mx-8 text-primary/40">•</span>
                NO CODE <span className="mx-8 text-primary/40">•</span>
              </span>
            ))}
        </motion.div>

        {/* SECOND ROW: Tracks Right */}
        <motion.div
          style={{ x: xRight }}
          className="flex whitespace-nowrap text-7xl md:text-9xl font-black uppercase tracking-tighter"
        >
          {Array(4)
            .fill("")
            .map((_, i) => (
              <span
                key={i}
                className="flex items-center text-transparent stroke-text"
              >
                GENERATE ANYTHING{" "}
                <span className="mx-8 text-purple-500/30">•</span>
                LIGHTNING FAST{" "}
                <span className="mx-8 text-purple-500/30">•</span>
                100 SCORE <span className="mx-8 text-purple-500/30">•</span>
              </span>
            ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ScrollTicker;
