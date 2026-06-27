import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  Globe,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getShowcaseWebsites } from "@/api/website";

// Fallback thumbnail used when a deployed site has no extractable image.
const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=1200&auto=format&fit=crop";

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const Showcase = () => {
  const dispatch = useDispatch();
  const { showcase, showcaseLoading, showcaseError } = useSelector(
    (state) => state.website,
  );

  useEffect(() => {
    dispatch(getShowcaseWebsites());
  }, [dispatch]);

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

  // Live stats derived from the real number of deployed projects.
  const stats = [
    { label: "Sites Built", value: `${showcase.length}`, icon: Layout },
    {
      label: "Live Projects",
      value: `${showcase.length}`,
      icon: TrendingUp,
    },
    {
      label: "Creators",
      value: `${
        new Set(showcase.map((p) => p.creator?.name).filter(Boolean)).size
      }`,
      icon: Eye,
    },
    {
      label: "Deployed",
      value: `${showcase.length}`,
      icon: Heart,
    },
  ];

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
        {/* LOADING STATE */}
        {showcaseLoading && (
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Loading showcase...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!showcaseLoading && showcaseError && (
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-lg font-bold text-foreground">
              Failed to load showcase
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {showcaseError}
            </p>
            <Button
              variant="outline"
              onClick={() => dispatch(getShowcaseWebsites())}
              className="mt-2 gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!showcaseLoading && !showcaseError && showcase.length === 0 && (
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-4 rounded-full bg-muted/30">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Be the first to showcase your work! Generate and deploy a website
              to see it featured here.
            </p>
            <Link to="/generate">
              <Button className="mt-2 gap-2">
                <Sparkles className="w-4 h-4" />
                Create Your Site
              </Button>
            </Link>
          </div>
        )}

        {/* PROJECTS GRID */}
        {!showcaseLoading && !showcaseError && showcase.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {showcase.map((project) => (
              <motion.div
                key={project._id}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-border/40 bg-muted/10 backdrop-blur-md overflow-hidden flex flex-col transition-all duration-300 hover:bg-muted/20 hover:border-border/80"
              >
                {/* Preview Image */}
                <div className="relative h-52 overflow-hidden border-b border-border/20">
                  <img
                    src={project.thumbnail || FALLBACK_THUMBNAIL}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = FALLBACK_THUMBNAIL;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                  {/* Deployed Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="outline"
                      className="bg-background/80 backdrop-blur-md border-border/60 text-[10px] font-bold uppercase tracking-wider gap-1"
                    >
                      <Globe className="w-3 h-3 text-primary" />
                      Live
                    </Badge>
                  </div>

                  {/* External Link Icon */}
                  <div className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 backdrop-blur-md border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {project.title}
                  </h3>

                  {/* Creator Info */}
                  {project.creator && (
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={project.creator.avatar}
                        alt={project.creator.name}
                        className="w-5 h-5 rounded-full object-cover border border-border/40"
                        onError={(e) => {
                          e.target.src =
                            "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                        }}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {project.creator.name}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-muted/40 text-muted-foreground border border-border/20 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-border/10 flex items-center justify-between mt-auto">
                    <Link
                      to={`/live-site/${project._id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Site
                    </Link>
                    {project.deployedUrl && (
                      <a
                        href={project.deployedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
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
