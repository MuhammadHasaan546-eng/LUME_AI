import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * TiltCard
 * A premium interactive card with:
 *  - Subtle 3D tilt that follows the cursor
 *  - A moving conic-gradient border that lights up on hover
 *  - A radial spotlight that tracks the pointer
 *  - Scroll-reactive parallax & tilt driven by Lenis smooth scroll
 *
 * Wrap any content inside <TiltCard>...</TiltCard>.
 */
const TiltCard = React.forwardRef(
  (
    {
      children,
      className,
      intensity = 8, // max rotation in degrees
      spotlight = true,
      borderGradient = true,
      scrollParallax = true, // enable scroll-driven parallax & tilt
      parallaxDistance = 40, // px the card drifts vertically on scroll
      scrollTilt = 6, // extra rotateX (deg) layered on top of mouse tilt
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef(null);

    // Raw pointer position (0 -> 1 across the card)
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Smoothed rotation values for buttery motion
    const rotateX = useSpring(
      useTransform(mouseY, [0, 1], [intensity, -intensity]),
      { stiffness: 150, damping: 18, mass: 0.4 },
    );
    const rotateY = useSpring(
      useTransform(mouseX, [0, 1], [-intensity, intensity]),
      { stiffness: 150, damping: 18, mass: 0.4 },
    );

    // --- Scroll-driven parallax & tilt ---
    // Tracks the card's progress as it travels through the viewport.
    // Lenis drives native scroll, so framer-motion's useScroll reads the
    // smoothed position automatically — giving buttery scroll-reactive motion.
    const { scrollYProgress } = useScroll({
      target: innerRef,
      offset: ["start end", "end start"],
    });

    // Subtle vertical drift as the card enters/leaves the viewport
    const scrollY = useTransform(
      scrollYProgress,
      [0, 1],
      scrollParallax ? [parallaxDistance, -parallaxDistance] : [0, 0],
    );

    // Extra tilt layered on top of the mouse-driven rotation
    const scrollRotateX = useTransform(
      scrollYProgress,
      [0, 1],
      scrollParallax ? [scrollTilt, -scrollTilt] : [0, 0],
    );

    // Merge mouse tilt + scroll tilt into a single rotateX axis
    const combinedRotateX = useTransform(
      [rotateX, scrollRotateX],
      ([mouse, scroll]) => mouse + scroll,
    );

    // Spotlight position in % for the radial glow
    const spotlightX = useTransform(mouseX, [0, 1], ["0%", "100%"]);
    const spotlightY = useTransform(mouseY, [0, 1], ["0%", "100%"]);

    // Conic gradient rotation for the animated border
    const borderAngle = useMotionValue(0);
    const borderRotation = useTransform(
      borderAngle,
      (v) =>
        `conic-gradient(from ${v}deg, transparent 0%, var(--tw-gradient-from, #6366f1) 25%, var(--tw-gradient-to, #ec4899) 50%, transparent 75%)`,
    );

    // Pointer-tracking spotlight background (computed at top level to respect hooks rules)
    const spotlightBg = useTransform(
      [spotlightX, spotlightY],
      ([x, y]) =>
        `radial-gradient(400px circle at ${x} ${y}, rgba(99,102,241,0.15), transparent 60%)`,
    );

    const handleMouseMove = (e) => {
      const el = innerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseEnter = () => {
      // Kick off the rotating border on hover
      let raf;
      const animate = () => {
        borderAngle.set((borderAngle.get() + 2) % 360);
        raf = requestAnimationFrame(animate);
      };
      animate();
      innerRef.current.__borderRaf = raf;
    };

    const handleMouseLeave = () => {
      mouseX.set(0.5);
      mouseY.set(0.5);
      if (innerRef.current?.__borderRaf) {
        cancelAnimationFrame(innerRef.current.__borderRaf);
        innerRef.current.__borderRaf = null;
      }
    };

    return (
      <motion.div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: combinedRotateX,
          rotateY,
          y: scrollY,
          transformStyle: "preserve-3d",
          transformPerspective: 1000,
        }}
        className={cn(
          "group/tilt relative rounded-3xl [transform-style:preserve-3d] will-change-transform",
          className,
        )}
        {...props}
      >
        {/* Animated gradient border layer */}
        {borderGradient && (
          <motion.div
            aria-hidden
            style={{ background: borderRotation }}
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-[2px] transition-opacity duration-500 group-hover/tilt:opacity-100"
          />
        )}

        {/* Inner content surface */}
        <div className="relative h-full w-full overflow-hidden rounded-[inherit] border border-primary/10 bg-card/60 backdrop-blur-md transition-colors duration-500 group-hover/tilt:border-primary/30">
          {/* Pointer-tracking spotlight */}
          {spotlight && (
            <motion.div
              aria-hidden
              style={{ background: spotlightBg }}
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
            />
          )}

          {/* Content lifted slightly toward the viewer for depth */}
          <div
            className="relative z-10 h-full"
            style={{ transform: "translateZ(40px)" }}
          >
            {children}
          </div>
        </div>
      </motion.div>
    );
  },
);

TiltCard.displayName = "TiltCard";

export default TiltCard;
