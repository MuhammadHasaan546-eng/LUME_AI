import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Heart,
  Eye,
  TrendingUp,
  Layout,
  ShoppingBag,
  Newspaper,
  Briefcase,
  Utensils,
  Camera,
} from "lucide-react";

const showcaseProjects = [
  {
    id: 1,
    title: "Aurora Luxury Watches",
    category: "E-Commerce",
    description:
      "A premium dark-themed watch store with cinematic product showcases and seamless checkout.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2370&auto=format&fit=crop",
    likes: "12.4k",
    views: "89.2k",
    gradient: "from-amber-500/20 to-transparent",
    icon: ShoppingBag,
    tags: ["Dark Mode", "E-Commerce", "Animations"],
  },
  {
    id: 2,
    title: "Nexus Tech Portfolio",
    category: "Portfolio",
    description:
      "A developer portfolio with interactive terminal, project grid, and smooth page transitions.",
    image:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=2370&auto=format&fit=crop",
    likes: "8.7k",
    views: "54.1k",
    gradient: "from-blue-500/20 to-transparent",
    icon: Briefcase,
    tags: ["Portfolio", "Terminal", "Developer"],
  },
  {
    id: 3,
    title: "Brew & Bean Café",
    category: "Restaurant",
    description:
      "A cozy coffee shop landing page with menu cards, reservation form, and warm aesthetics.",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2370&auto=format&fit=crop",
    likes: "6.2k",
    views: "41.8k",
    gradient: "from-orange-500/20 to-transparent",
    icon: Utensils,
    tags: ["Restaurant", "Menu", "Warm UI"],
  },
  {
    id: 4,
    title: "Quantum SaaS Landing",
    category: "SaaS",
    description:
      "A modern SaaS landing page with feature grid, pricing tiers, and animated hero section.",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2370&auto=format&fit=crop",
    likes: "15.1k",
    views: "102.5k",
    gradient: "from-purple-500/20 to-transparent",
    icon: Layout,
    tags: ["SaaS", "Landing", "Pricing"],
  },
  {
    id: 5,
    title: "Aperture Photography",
    category: "Photography",
    description:
      "A full-screen photography portfolio with masonry gallery, lightbox, and minimal design.",
    image:
      "https://images.unsplash.com/photo-1542038784456-1ea7d9c8a5c5?q=80&w=2370&auto=format&fit=crop",
    likes: "9.8k",
    views: "67.3k",
    gradient: "from-pink-500/20 to-transparent",
    icon: Camera,
    tags: ["Gallery", "Minimal", "Lightbox"],
  },
  {
    id: 6,
    title: "Pulse News Network",
    category: "Blog",
    description:
      "A modern news platform with categorized feeds, trending sidebar, and reading progress.",
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2370&auto=format&fit=crop",
    likes: "7.5k",
    views: "48.9k",
    gradient: "from-emerald-500/20 to-transparent",
    icon: Newspaper,
    tags: ["Blog", "News", "Feed"],
  },
];

const stats = [
  { label: "Sites Built", value: "50K+", icon: Layout },
  { label: "Active Creators", value: "12K+", icon: TrendingUp },
  { label: "Total Views", value: "2.4M", icon: Eye },
  { label: "Community Likes", value: "180K", icon: Heart },
];

const Showcase = () => {
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
      {/* Ambient Glow Spheres */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HERO TITLE HEADER */}
      <section className="pt-24 pb-16 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border/60 bg-muted/30 text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-6"
          >
            <Sparkles className="w-3 h-3 text-[#B94AF4]" />
            <span>Creator Showcase</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-foreground"
          >
            Built with Lume. <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic px-1">
              Powered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Explore a curated gallery of stunning websites crafted by the Lume
            community. From luxury stores to developer portfolios — all
            generated from simple text prompts.
          </motion.p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="px-6 relative z-10 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl border border-border/40 bg-muted/10 backdrop-blur-md hover:bg-muted/20 transition-all"
            >
              <stat.icon className="w-5 h-5 text-primary" />
              <span className="text-2xl font-black text-foreground">
                {stat.value}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* SHOWCASE GRID */}
      <section className="pb-32 px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {showcaseProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-border/40 bg-muted/10 backdrop-blur-md overflow-hidden flex flex-col transition-all duration-300 hover:bg-muted/20 hover:border-border/80"
            >
              {/* Preview Image */}
              <div className="relative h-52 overflow-hidden border-b border-border/20">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="outline"
                    className="bg-background/80 backdrop-blur-md border-border/60 text-[10px] font-bold uppercase tracking-wider gap-1"
                  >
                    <project.icon className="w-3 h-3 text-primary" />
                    {project.category}
                  </Badge>
                </div>

                {/* External Link Icon */}
                <div className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 backdrop-blur-md border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3.5 h-3.5 text-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-muted/40 text-muted-foreground border border-border/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats Footer */}
                <div className="pt-4 border-t border-border/10 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-pink-500 fill-pink-500/20" />
                    {project.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-blue-500" />
                    {project.views}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative rounded-[2rem] overflow-hidden bg-primary px-8 py-16 text-primary-foreground shadow-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent)] animate-pulse" />
          <h2 className="relative text-3xl md:text-5xl font-black tracking-tighter mb-6 uppercase">
            Your site could be here
          </h2>
          <p className="relative text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of creators building the future of the web with Lume
            AI. Start free — no credit card required.
          </p>
          <Link to="/generate">
            <Button
              size="lg"
              variant="secondary"
              className="relative h-14 px-10 text-lg font-black rounded-2xl hover:scale-105 transition-transform shadow-xl gap-2"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Showcase;
