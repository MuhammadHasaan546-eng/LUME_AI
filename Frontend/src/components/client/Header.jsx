import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 flex h-16 min-h-[64px] items-center justify-between border-b px-4 sm:px-6 transition-all duration-300 ${
        isScrolled
          ? "border-border/70 bg-background/90 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          : "border-border/40 bg-background/65 backdrop-blur-xl"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px  bg-gradient-to-r from-transparent via-purple-500/40 to-transparent " />

      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.04, x: -2 }}
          whileTap={{ scale: 0.96 }}
          className="group inline-flex items-center justify-center rounded-full border border-border/60 bg-muted/35 p-2.5 text-muted-foreground shadow-sm transition-all duration-300 hover:border-primary/25 hover:bg-muted/80 hover:text-foreground hover:shadow-[0_0_18px_-8px_rgba(185,74,244,0.45)] cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        </motion.button>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-foreground">Dashboard</p>
          <p className="text-xs text-muted-foreground">
            Manage your projects with ease
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <motion.button
          onClick={() => navigate("/generate")}
          whileHover="hover"
          whileTap={{ scale: 0.97 }}
          className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-border/60 bg-muted/35 px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-muted/70 hover:shadow-[0_0_22px_-10px_rgba(185,74,244,0.45)] cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <motion.span
            variants={{
              hover: { rotate: 90, scale: 1.05 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="relative z-10 flex items-center justify-center text-muted-foreground transition-colors duration-300 group-hover:text-purple-500"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </motion.span>

          <span className="relative z-10 transition-colors duration-300 group-hover:text-foreground">
            New Project
          </span>
        </motion.button>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;
