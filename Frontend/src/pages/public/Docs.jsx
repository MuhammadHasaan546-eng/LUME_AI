import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Code2,
  Rocket,
  Zap,
  Terminal,
  Copy,
  Check,
  ChevronRight,
  Lightbulb,
  Palette,
  Layers,
  Globe,
} from "lucide-react";

const docSections = [
  {
    id: "getting-started",
    icon: Rocket,
    title: "Getting Started",
    description: "Launch your first AI-generated website in under 60 seconds.",
    color: "text-purple-500",
    articles: [
      { title: "Quick Start Guide", readTime: "3 min" },
      { title: "Your First Prompt", readTime: "5 min" },
      { title: "Understanding the Editor", readTime: "7 min" },
      { title: "Publishing Your Site", readTime: "4 min" },
    ],
  },
  {
    id: "prompting",
    icon: Lightbulb,
    title: "Prompt Engineering",
    description: "Master the art of describing websites to the AI engine.",
    color: "text-amber-500",
    articles: [
      { title: "Writing Effective Prompts", readTime: "6 min" },
      { title: "Design Style Keywords", readTime: "5 min" },
      { title: "Iterative Refinement", readTime: "8 min" },
      { title: "Advanced Prompt Patterns", readTime: "10 min" },
    ],
  },
  {
    id: "editor",
    icon: Code2,
    title: "Editor & Code",
    description: "Dive into the Monaco-powered source editor and sandbox.",
    color: "text-blue-500",
    articles: [
      { title: "Source Code Editing", readTime: "5 min" },
      { title: "Live Preview Sandbox", readTime: "4 min" },
      { title: "Exporting HTML/CSS", readTime: "3 min" },
      { title: "Custom JavaScript Injection", readTime: "9 min" },
    ],
  },
  {
    id: "deployment",
    icon: Globe,
    title: "Deployment",
    description: "Deploy to the world with Lume subdomains or custom domains.",
    color: "text-emerald-500",
    articles: [
      { title: "One-Click Deploy", readTime: "3 min" },
      { title: "Custom Domain Setup", readTime: "6 min" },
      { title: "SSL & HTTPS", readTime: "4 min" },
      { title: "Analytics Integration", readTime: "7 min" },
    ],
  },
  {
    id: "theming",
    icon: Palette,
    title: "Theming & Styling",
    description: "Control colors, dark mode, and visual aesthetics.",
    color: "text-pink-500",
    articles: [
      { title: "Dark Mode Toggle", readTime: "2 min" },
      { title: "Color Palette Control", readTime: "5 min" },
      { title: "Typography Settings", readTime: "4 min" },
      { title: "Responsive Breakpoints", readTime: "6 min" },
    ],
  },
  {
    id: "api",
    icon: Terminal,
    title: "API Reference",
    description: "Integrate Lume AI into your own workflows programmatically.",
    color: "text-cyan-500",
    articles: [
      { title: "Authentication", readTime: "4 min" },
      { title: "Generate Endpoint", readTime: "6 min" },
      { title: "Webhooks", readTime: "8 min" },
      { title: "Rate Limits", readTime: "3 min" },
    ],
  },
];

const codeExample = `// Generate a website with a single prompt
const response = await fetch("https://api.lume.ai/v1/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "A luxury portfolio with dark mode and animations",
    theme: "dark",
  }),
});

const { websiteId, previewUrl } = await response.json();`;

const Docs = () => {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip relative">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      {/* HERO */}
      <section className="pt-24 pb-12 px-6 relative z-10 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border/60 bg-muted/30 text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-6"
          >
            <BookOpen className="w-3 h-3 text-primary" />
            <span>Documentation</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6"
          >
            Learn Lume{" "}
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic">
              inside out
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Everything you need to build, refine, and deploy AI-generated
            websites. From your first prompt to advanced API integration.
          </motion.p>
        </div>
      </section>

      {/* QUICK START CODE BLOCK */}
      <section className="px-6 relative z-10 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-border/40 bg-muted/10 backdrop-blur-md overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 bg-muted/20">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold font-mono text-muted-foreground">
                  quick-start.js
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/40"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-5 overflow-x-auto text-xs leading-relaxed font-mono text-foreground/90">
              <code>{codeExample}</code>
            </pre>
          </div>
        </motion.div>
      </section>

      {/* DOC SECTIONS GRID */}
      <section className="pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-black tracking-tight mb-8 flex items-center gap-2"
          >
            <Layers className="w-5 h-5 text-primary" />
            Browse by Topic
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {docSections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                onClick={() => setActiveSection(section.id)}
                className={`group cursor-pointer rounded-2xl border bg-muted/10 backdrop-blur-md p-6 transition-all duration-300 ${
                  activeSection === section.id
                    ? "border-primary/40 bg-muted/20"
                    : "border-border/40 hover:border-border/80 hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-muted/40 border border-border/20">
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <h3 className="text-base font-bold tracking-tight">
                    {section.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.articles.map((article) => (
                    <li
                      key={article.title}
                      className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3 text-primary/60" />
                        {article.title}
                      </span>
                      <span className="text-[10px] font-mono opacity-60">
                        {article.readTime}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative rounded-[2rem] overflow-hidden border border-border/40 bg-muted/10 backdrop-blur-md px-8 py-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08),transparent)]" />
          <Zap className="relative w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="relative text-3xl md:text-4xl font-black tracking-tighter mb-4">
            Ready to build?
          </h2>
          <p className="relative text-muted-foreground mb-8 max-w-md mx-auto">
            Put the docs into practice. Generate your first AI website now.
          </p>
          <Link to="/generate">
            <Button
              size="lg"
              className="relative h-14 px-10 text-lg font-black rounded-2xl hover:scale-105 transition-transform shadow-xl gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Docs;
