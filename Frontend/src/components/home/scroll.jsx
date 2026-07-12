import { useEffect } from "react";
import Lenis from "lenis";

/**
 * SmoothScroll
 * Initializes Lenis smooth scrolling for the whole app.
 * Mount this once near the root (e.g. inside main.jsx) so the
 * requestAnimationFrame loop runs for the lifetime of the app.
 *
 * Docs: https://github.com/darkroomengineering/lenis
 */
const SmoothScroll = () => {
  useEffect(() => {
    // Respect users who prefer reduced motion — skip smooth scrolling
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Drive Lenis with requestAnimationFrame
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Expose the instance globally so other code can call lenis.scrollTo()
    window.__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
};

export default SmoothScroll;
