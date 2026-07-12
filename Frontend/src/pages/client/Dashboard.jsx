import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/client/Header";
import { deleteWebsite, deployWebsite, getUserWebsites } from "@/api/website";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  LayoutGrid,
  Loader2,
  MoreVertical,
  Rocket,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Canvas from "@/editor/Canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      delay: index * 0.08,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const formatDate = (date) => {
  if (!date) return "Recently created";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date) => {
  if (!date) return "No updates yet";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Compact, non-interactive Canvas preview for dashboard cards. Renders the
 * pageData JSON through the same typed section components used in the editor,
 * scaled down to fit the card thumbnail. Falls back to a placeholder when
 * the website has no pageData yet (e.g. legacy records with only latestCode).
 */
const DashboardPreview = ({ pageData }) => {
  if (!pageData) {
    return (
      <div className="grid h-full w-full place-items-center bg-zinc-100 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mb-2 text-2xl">✨</div>
          <p className="text-xs font-semibold text-zinc-400">
            Open editor to generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="origin-top-left overflow-hidden"
      style={{ transform: "scale(0.38)", width: "263%", height: "263%" }}
    >
      <Canvas
        pageData={pageData}
        device="desktop"
        className="pointer-events-none select-none"
      />
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { websites, isLoading, error } = useSelector((state) => state.website);
  const userName = user?.name?.split(" ")[0] || "Creator";

  // Delete-project confirmation flow. `deleteTarget` holds the website the
  // user intends to delete; when non-null the confirmation dialog is open.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(getUserWebsites());
  }, [dispatch]);

  const handleQuickDeploy = async (event, website) => {
    event.stopPropagation();

    if (!website.pageData) {
      toast.error(
        "This website has no page data to deploy. Open the editor first.",
      );
      navigate(`/editor/${website._id}`);
      return;
    }

    try {
      const response = await dispatch(
        deployWebsite({
          websiteId: website._id,
          pageData: website.pageData,
        }),
      ).unwrap();
      toast.success(response.message || "Website deployed successfully.");
      navigate(`/live-site/${website._id}`);
    } catch (err) {
      toast.error(err || "Deploy failed. Please try again.");
    }
  };

  const handleOpenLiveSite = (event, website) => {
    event.stopPropagation();
    navigate(`/live-site/${website._id}`);
  };

  // Open the delete-confirmation modal for a specific project card.
  const handleDeleteClick = (event, website) => {
    event.stopPropagation();
    setDeleteTarget(website);
  };

  // Confirmed delete: dispatch the soft-delete thunk and surface a toast for
  // either outcome. The Redux slice removes the project from `websites`
  // automatically, so the card disappears without a manual refetch.
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const websiteId = deleteTarget._id;
    setIsDeleting(true);
    try {
      const response = await dispatch(deleteWebsite(websiteId)).unwrap();
      toast.success(response.message || "Project deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip relative">
      <DashboardHeader />

      {/* Luxury Ambient Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none dark:bg-purple-900/5" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none dark:bg-blue-900/5" />

      {/* Hero Section */}
      <section className="pt-20 pb-14 md:pt-28 md:pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto mb-8 w-fit rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 px-6 py-4 shadow-2xl shadow-purple-500/10 backdrop-blur-xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"
            />
            <div className="relative flex items-center gap-3">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Welcome back
                </p>
                <h2 className="text-xl font-black text-foreground sm:text-2xl">
                  {userName}, ready to build?
                </h2>
              </div>
            </div>
          </motion.div>

          {/* Subtle Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B94AF4]" />
            <span>Next-Gen Prompt-to-Code Platform</span>
          </motion.div>

          {/* Editorial Title */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 tracking-tight leading-[1.1]"
          >
            Your AI-Powered <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic px-1">
              Website Builder
            </span>
          </motion.h1>

          {/* Elegant Description */}
          <motion.p
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Create stunning, editorial-grade websites in minutes with
            AI-generated custom designs and clean production code.
          </motion.p>

          {/* Interactive Action Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none"
          >
            {/* Primary Action Button */}
            <motion.button
              onClick={() => navigate("/generate")}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/10 transition-all cursor-pointer border border-primary/20 hover:bg-primary/90"
            >
              <span>Create Your Website</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>

            {/* Secondary Action Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-border/80 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm font-bold px-8 py-4 rounded-xl transition-all cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Explore Templates</span>
            </motion.button>
          </motion.div>

          {/* Premium Modular Grid Stats */}
          <div className="mt-28 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { number: "50+", label: "Premium Layouts" },
              { number: "10k+", label: "Active Creators" },
              { number: "4.9/5", label: "Client Rating" },
              { number: "24/7", label: "Instant Sync" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.08 }}
                className="p-5 rounded-2xl border border-border/40 bg-muted/10 backdrop-blur-sm text-center flex flex-col justify-center items-center group hover:border-primary/20 transition-all hover:bg-muted/20"
              >
                <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1 group-hover:scale-105 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Websites */}
      <section className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs font-bold text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5 text-[#B94AF4]" />
                Your created websites
              </div>
              <h3 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                All your AI websites
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Every website you generated appears here, so you can reopen,
                edit, and continue improving it anytime.
              </p>
            </div>

            <motion.button
              onClick={() => navigate("/generate")}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" />
              Generate New
            </motion.button>
          </motion.div>

          {isLoading ? (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-border/50 bg-muted/10 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm font-semibold text-destructive">
              {error}
            </div>
          ) : websites.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {websites.map((website, index) => (
                <motion.article
                  key={website._id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  onClick={() => navigate(`/editor/${website._id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/50 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative mb-5 h-40 overflow-hidden rounded-2xl border border-border/40 bg-muted/30 shadow-inner">
                    <DashboardPreview pageData={website.pageData} />
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-background/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-foreground shadow-sm backdrop-blur-md">
                        <Sparkles className="h-3 w-3 text-[#B94AF4]" />
                        Canvas
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-md ${
                          website.deployed
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "border-purple-400/40 bg-purple-500/15 text-purple-600 dark:text-purple-300"
                        }`}
                      >
                        {website.deployed ? (
                          <Globe2 className="h-3 w-3" />
                        ) : (
                          <Rocket className="h-3 w-3" />
                        )}
                        {website.deployed ? "Live" : "Deploy"}
                      </span>
                    </div>
                  </div>

                  <div className="relative space-y-4">
                    <div>
                      <h4 className="line-clamp-1 text-lg font-black text-foreground">
                        {website.title || "Untitled Website"}
                      </h4>
                      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Created {formatDate(website.createdAt)}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-[#B94AF4]" />
                        Latest update {formatDateTime(website.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          website.deployed
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-purple-500/10 text-purple-500"
                        }`}
                      >
                        {website.deployed ? (
                          <Globe2 className="h-3.5 w-3.5" />
                        ) : (
                          <Rocket className="h-3.5 w-3.5" />
                        )}
                        {website.deployed ? "Deployed" : "Deploy pending"}
                      </span>
                      <div className="flex items-center gap-1">
                        {website.deployed ? (
                          <button
                            type="button"
                            onClick={(event) =>
                              handleOpenLiveSite(event, website)
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-transform hover:translate-x-1"
                          >
                            Live Site
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) =>
                              handleQuickDeploy(event, website)
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-transform hover:translate-x-1"
                          >
                            Deploy Now
                            <Rocket className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Per-card actions menu (delete) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(event) => event.stopPropagation()}
                              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="Project actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(event) =>
                                handleDeleteClick(event, website)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-dashed border-border/70 bg-muted/10 p-10 text-center backdrop-blur-sm"
            >
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <h4 className="text-2xl font-black text-foreground">
                No websites yet
              </h4>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Create your first AI website and it will automatically show up
                in this dashboard.
              </p>
              <button
                onClick={() => navigate("/generate")}
                className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Create First Website
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Delete-project confirmation modal ── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              Delete project?
            </DialogTitle>
            <DialogDescription>
              You're about to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.title || "this project"}
              </span>
              . This removes it from your dashboard and takes any live
              deployment offline. This action cannot be undone from the
              interface.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
