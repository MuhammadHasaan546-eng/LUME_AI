import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Zap,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  ArrowRight,
  Gauge,
  Rocket,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TiltCard from "@/components/home/TiltCard";
import { Button } from "@/components/ui/button";

/* ============================================================
   AnimatedCounter — smoothly counts from 0 to `value`
   once it scrolls into view (mirrors StatsSection pattern).
   ============================================================ */
const AnimatedCounter = ({
  value,
  duration = 2,
  decimals = 0,
  suffix = "",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(
        new Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Number(latest.toFixed(decimals))),
      );
    });
    return () => unsubscribe();
  }, [spring, decimals]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
};

const Features = () => {
  const navigate = useNavigate();

  // --- Luxury Feature Sets Data Matrix ---
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
        "Watch your changes render in near zero-latency workspace frames. Code sandbox layers execute your code modules securely under 60ms.",
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

  // --- Capability metrics for the animated counter band ---
  const metrics = [
    {
      icon: Gauge,
      value: 60,
      suffix: "ms",
      label: "Avg. compile latency",
      color: "text-emerald-500",
      glow: "from-emerald-500/20",
    },
    {
      icon: Cpu,
      value: 4,
      suffix: "x",
      label: "Parallel agent checks",
      color: "text-purple-500",
      glow: "from-purple-500/20",
    },
    {
      icon: ShieldCheck,
      value: 99.9,
      decimals: 1,
      suffix: "%",
      label: "Sandboxed security",
      color: "text-blue-500",
      glow: "from-blue-500/20",
    },
    {
      icon: Rocket,
      value: 30,
      suffix: "s",
      label: "Prompt to live site",
      color: "text-orange-500",
      glow: "from-orange-500/20",
    },
  ];

  // --- Motion Variants for staggered sequence loading ---
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

  const scrollFadeUp = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // --- Scroll-driven parallax ticker ---
  const tickerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: tickerRef,
    offset: ["start end", "end start"],
  });
  const xLeft = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const xRight = useTransform(scrollYProgress, [0, 1], [-500, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip relative">
      {/* --- HERO TITLE HEADER --- */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        {/* Futuristic Background Grid */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        />

        {/* Dynamic Fluid Blobs */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#B94AF4]/15 blur-[120px] -z-20 rounded-full pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 blur-[120px] -z-20 rounded-full pointer-events-none"
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
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

          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="mt-8"
          >
            <Button
              onClick={() => navigate("/generate")}
              size="lg"
              className="px-8 h-12 rounded-xl font-bold bg-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all"
            >
              Try the Engine <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* --- SCROLL-TO-MOVE TEXT TICKER --- */}
      <section
        ref={tickerRef}
        className="py-10 bg-background/50 border-y border-primary/5 overflow-hidden select-none"
      >
        <div className="flex flex-col gap-2 max-w-full">
          {/* Row 1: Leftward tracking display */}
          <motion.div
            style={{ x: xLeft }}
            className="flex whitespace-nowrap text-5xl md:text-7xl font-black uppercase tracking-tighter"
          >
            {Array(4)
              .fill("")
              .map((_, i) => (
                <span
                  key={i}
                  className="flex items-center text-muted-foreground/15"
                >
                  Prompt to Code <span className="mx-6 text-primary/30">•</span>
                  Edge Delivery <span className="mx-6 text-primary/30">
                    •
                  </span>{" "}
                  Luxury UI <span className="mx-6 text-primary/30">•</span>
                </span>
              ))}
          </motion.div>

          {/* Row 2: Rightward tracking outline display */}
          <motion.div
            style={{ x: xRight }}
            className="flex whitespace-nowrap text-5xl md:text-7xl font-black uppercase tracking-tighter"
          >
            {Array(4)
              .fill("")
              .map((_, i) => (
                <span
                  key={i}
                  className="flex items-center text-transparent"
                  style={{ WebkitTextStroke: "1px rgba(156, 163, 175, 0.2)" }}
                >
                  Multi-Agent Sync{" "}
                  <span className="mx-6 text-purple-500/20">•</span> Instant
                  Deploy <span className="mx-6 text-purple-500/20">•</span>{" "}
                  Secure Sandbox{" "}
                  <span className="mx-6 text-purple-500/20">•</span>
                </span>
              ))}
          </motion.div>
        </div>
      </section>

      {/* --- CAPABILITIES MODULAR GRID (TiltCard 3D) --- */}
      <section className="py-24 px-6 relative z-10">
        {/* Ambient drifting glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] -z-10 rounded-full pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 uppercase">
            Architectural Layers
          </h2>
          <p className="text-muted-foreground">
            Six engineered systems working in concert to turn intent into
            production interfaces.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuresList.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="lume-tilt-perspective"
            >
              <TiltCard className="h-full">
                <div className="p-8 h-full flex flex-col justify-between">
                  {/* Micro Header Layer inside card */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-3 rounded-xl border border-border/50 bg-background/50 text-foreground group-hover/tilt:scale-125 group-hover/tilt:rotate-6 transition-transform duration-500 shadow-sm">
                      {feature.icon}
                    </div>
                    <span className="text-sm font-black text-muted-foreground/30 group-hover/tilt:text-primary/40 tracking-widest font-mono transition-colors">
                      {feature.index}
                    </span>
                  </div>

                  {/* Typography details */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative Subtle Footer Link Accents */}
                  <div className="mt-8 pt-4 border-t border-border/10 flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/0 group-hover/tilt:text-muted-foreground/80 group-hover/tilt:translate-x-1 transition-all duration-300">
                    <span>System Specs</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- ANIMATED METRICS COUNTER BAND --- */}
      <section className="relative py-24 px-6 border-y border-primary/5 bg-secondary/10 overflow-hidden">
        {/* Ambient drifting glow */}
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/10 blur-[140px] rounded-full -z-10 pointer-events-none"
        />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 uppercase">
              Measured Performance
            </h2>
            <p className="text-muted-foreground">
              Real engineering metrics, not marketing fluff.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group relative p-8 rounded-3xl border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden"
                >
                  {/* Hover gradient wash */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div className="relative z-10">
                    <div
                      className={`mb-5 inline-flex p-3 rounded-2xl bg-primary/10 ${stat.color} group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                      <AnimatedCounter
                        value={stat.value}
                        decimals={stat.decimals}
                        suffix={stat.suffix}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- WORKFLOW PROCESS SECTION --- */}
      <section className="py-24 px-6 border-b border-primary/5 bg-background relative overflow-hidden">
        {/* Ambient glow */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 blur-[140px] -z-10 rounded-full pointer-events-none"
        />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 uppercase">
              How It Flows
            </h2>
            <p className="text-muted-foreground">
              Three steps from idea to live site.
            </p>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connecting progress line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

            {[
              {
                icon: <Wand2 className="h-7 w-7" />,
                title: "Describe",
                desc: "Type your vision in plain language. The prompt engine parses intent instantly.",
              },
              {
                icon: <Cpu className="h-7 w-7" />,
                title: "Generate",
                desc: "Multi-agent layers assemble clean React + Tailwind, validated in parallel.",
              },
              {
                icon: <Rocket className="h-7 w-7" />,
                title: "Deploy",
                desc: "One click pushes to a global edge CDN. Your site is live in seconds.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 rounded-3xl border border-primary/10 bg-card/60 backdrop-blur-md overflow-hidden"
              >
                {/* Hover gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  {/* Step number badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-primary p-3 bg-primary/10 w-fit rounded-2xl group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500">
                      {step.icon}
                    </div>
                    <span className="text-2xl font-black text-muted-foreground/20 group-hover:text-primary/30 tracking-widest font-mono transition-colors">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2rem] overflow-hidden bg-primary px-8 py-20 text-center text-primary-foreground shadow-2xl"
          >
            {/* Smooth Breathing Glow behind CTA Content */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_70%)]"
            />

            <h2 className="relative text-4xl md:text-6xl font-black tracking-tighter mb-8 uppercase">
              Ready to build the future?
            </h2>
            <Button
              onClick={() => navigate("/generate")}
              size="lg"
              variant="secondary"
              className="relative h-16 px-12 text-xl font-black rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              Start Building Now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features;
