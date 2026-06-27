import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

/**
 * SmoothScroll
 * Wraps the app and bootstraps Lenis for buttery inertial scrolling.
 *
 * - Drives Lenis via a single requestAnimationFrame loop.
 * - Respects reduced-motion users by disabling smoothing.
 * - Exposes the instance on window.__lenis so any component can call
 *   window.__lenis.scrollTo(target) for anchor-style navigation.
 * - Cleans up on unmount.
 */
const SmoothScroll = ({ children }) => {
  useEffect(() => {
    // Honour users who prefer reduced motion — skip smoothing entirely.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    // Expose globally so any component can call lenis.scrollTo()
    window.__lenis = lenis;

    // Drive Lenis from a single rAF loop
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return children;
};

export default SmoothScroll;
