import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  ArrowRight,
  Gauge,
} from "lucide-react";

const Features = () => {
  // Luxury Feature Sets Data Matrix
  const featuresList = [
    {
      icon: <Sparkles className="w-5 h-5 text-[#B94AF4]" />,
      index: "01",
      title: "Natural Prompt Engine",
      description:
        "Describe your visionary concept in casual conversational text. Our model interprets layout composition, hierarchy, and micro-interactions instantly.",
      gradient: "from-[#B94AF4]/20 to-transparent",
    },
    {
      icon: <Code2 className="w-5 h-5 text-blue-500" />,
      index: "02",
      title: "Clean MERN Stack Output",
      description:
        "No messy code generators here. Get production-grade, highly optimized React components styled beautifully with raw Tailwind CSS variables.",
      gradient: "from-blue-500/10 to-transparent",
    },
    {
      icon: <Gauge className="w-5 h-5 text-emerald-500" />,
      index: "03",
      title: "Ultra-Fast Compilation",
      description:
        "Watch your changes render in near zero-latency workspace frames. Code sandbox sandboxing layers execute your code modules securely under 60ms.",
      gradient: "from-emerald-500/10 to-transparent",
    },
    {
      icon: <Layers className="w-5 h-5 text-pink-500" />,
      index: "04",
      title: "Modern Luxury UI Core",
      description:
        "Pre-configured editorial grids, sophisticated responsive typography fluid pairs, and high-end glassmorphism assets injected by default.",
      gradient: "from-pink-500/10 to-transparent",
    },
    {
      icon: <Cpu className="w-5 h-5 text-purple-500" />,
      index: "05",
      title: "Multi-Agent OpenRouter Sync",
      description:
        "Leverage advanced autonomous LLM architecture layers in parallel to double-check error lines, semantic structure, and logic trees instantly.",
      gradient: "from-purple-500/10 to-transparent",
    },
    {
      icon: <Terminal className="w-5 h-5 text-orange-500" />,
      index: "06",
      title: "One-Click Instant Deploy",
      description:
        "Push your polished builds onto production-grade servers with global CDN configurations without touching complex hosting terminal dashboards.",
      gradient: "from-orange-500/10 to-transparent",
    },
  ];

  // Motion Variants for clean sequence loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip relative">
      {/* Elegant Ambiance Glow Spheres */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HERO TITLE HEADER */}
      <section className="pt-24 pb-16 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border/60 bg-muted/30 text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-6"
          >
            <Zap className="w-3 h-3 text-[#B94AF4] fill-[#B94AF4]/20" />
            <span>Platform Capabilities</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-foreground"
          >
            Engineered for Elite <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic px-1">
              Web Development
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Explore the powerful architectural layers behind Lume.ai designed to
            turn text inputs into lightning-fast production interfaces.
          </motion.p>
        </div>
      </section>

      {/* CAPABILITIES MODULAR GRID */}
      <section className="pb-32 px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuresList.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="group relative p-8 rounded-2xl border border-border/40 bg-muted/10 backdrop-blur-md overflow-hidden flex flex-col justify-between transition-all duration-300 hover:bg-muted/20 hover:border-border/80"
            >
              {/* Radial Hover Background Accent */}
              <div
                className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${feature.gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none`}
              />

              <div>
                {/* Micro Header Layer inside card */}
                <div className="flex items-center justify-between mb-8">
                  <div className="p-3 rounded-xl border border-border/50 bg-background/50 text-foreground group-hover:border-primary/20 group-hover:bg-background transition-all shadow-sm">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-black text-muted-foreground/30 group-hover:text-primary/20 tracking-widest font-mono transition-colors">
                    {feature.index}
                  </span>
                </div>

                {/* Typography details */}
                <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative Subtle Footer Link Accents */}
              <div className="mt-8 pt-4 border-t border-border/10 flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/0 group-hover:text-muted-foreground/80 group-hover:translate-x-1 transition-all duration-300">
                <span>System Specs</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default Features;
