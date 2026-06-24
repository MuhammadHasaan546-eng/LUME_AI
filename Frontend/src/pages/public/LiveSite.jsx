import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Laptop,
  Smartphone,
  Monitor,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { getLiveWebsite } from "@/api/website";

const LiveSite = () => {
  const navigate = useNavigate();
  const { websiteId } = useParams();
  const dispatch = useDispatch();
  const { currentWebsite, isLoading, error } = useSelector(
    (state) => state.website,
  );
  const [copied, setCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [viewMode, setViewMode] = useState("desktop"); // desktop, tablet, mobile

  useEffect(() => {
    if (!websiteId) return;

    dispatch(getLiveWebsite(websiteId))
      .unwrap()
      .catch((err) => {
        toast.error(err || "Live website not found.");
      });
  }, [dispatch, websiteId]);

  const siteUrl =
    currentWebsite?.deployedUrl ||
    `${window.location.origin}/live-site/${websiteId}`;
  const siteTitle = currentWebsite?.title || "Lume Live Website";

  const liveSrcDoc = useMemo(() => {
    const code = currentWebsite?.latestCode?.trim();
    if (!code) return "";

    const liveGuard = `
<base href="about:srcdoc">
<script>
  document.addEventListener('submit', function (event) {
    event.preventDefault();
  }, true);
</script>`;

    if (/<head[\s>]/i.test(code)) {
      return code.replace(/<head([^>]*)>/i, `<head$1>${liveGuard}`);
    }

    return `${liveGuard}${code}`;
  }, [currentWebsite?.latestCode]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshFrame = () => {
    setIsReloading(true);
    const iframe = document.getElementById("live-preview-frame");
    if (iframe) {
      iframe.srcdoc = liveSrcDoc;
    }
    setTimeout(() => setIsReloading(false), 800);
  };

  // Dynamic width controller base on responsive layout tools buttons
  const getFrameWidth = () => {
    if (viewMode === "mobile") return "max-w-[390px]";
    if (viewMode === "tablet") return "max-w-[768px]";
    return "max-w-full";
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-500 overflow-hidden">
      {/* LUXURY CONTROL TOP BAR */}
      <header className="h-14 min-h-[56px] bg-background/60 backdrop-blur-xl px-4 flex items-center justify-between border-b border-border/40 z-30 transition-all duration-300">
        {/* Navigation & Info */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.03, x: -1 }}
            whileTap={{ scale: 0.97 }}
            className="p-2 rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/80 hover:border-primary/20 cursor-pointer"
            title="Back to Editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          <div className="h-4 w-[1px] bg-border/60 hidden xs:block" />

          <div className="flex flex-col hidden sm:block">
            <span className="text-xs font-black text-foreground tracking-wide line-clamp-1">
              {siteTitle}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>Production Live</span>
            </div>
          </div>
        </div>

        {/* Browser Mockup Navigation Address Bar */}
        <div className="hidden md:flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-1.5 w-full max-w-md mx-4 justify-between">
          <div className="flex items-center gap-2 truncate text-xs text-muted-foreground font-medium select-all">
            <span className="text-emerald-500 font-semibold">https://</span>
            <span className="truncate">
              {siteUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={handleCopyUrl}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleRefreshFrame}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              title="Refresh Frame"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isReloading ? "animate-spin text-primary" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Right Controls Actions Panel */}
        <div className="flex items-center gap-2.5">
          {/* Responsive Layout Breakpoint Switcher */}
          <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/20 p-1">
            <button
              onClick={() => setViewMode("desktop")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "desktop" ? "bg-background text-primary shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
              title="Desktop Screen"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("tablet")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "tablet" ? "bg-background text-primary shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
              title="Tablet Screen"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "mobile" ? "bg-background text-primary shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
              title="Mobile Screen"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* External Tab Opener Action */}
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/10 border border-primary/20 active:scale-[0.98]"
          >
            <span>Open Site</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
          </a>
        </div>
      </header>

      {/* CANVAS VIEWPORT CONTAINER WORKSPACE */}
      <div className="flex-1 bg-muted/20 p-4 md:p-6 flex justify-center items-center overflow-y-auto relative">
        {/* Decorative Blurred Ambience background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`w-full h-full bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden relative group transition-all ${getFrameWidth()}`}
        >
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/90 text-sm font-bold text-muted-foreground backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading live website...
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background p-6 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              <h2 className="text-lg font-black text-foreground">
                Live site unavailable
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Back to editor
              </button>
            </div>
          )}

          {/* Simulated Browser Iframe Sandbox Viewport */}
          <iframe
            id="live-preview-frame"
            srcDoc={liveSrcDoc}
            title={siteTitle}
            className="w-full h-full bg-white border-none relative z-10"
            sandbox="allow-scripts allow-same-origin"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center z-0">
            <span className="text-sm font-bold tracking-wide text-foreground/80 mb-1">
              {liveSrcDoc
                ? "Rendering Webspace Live Code"
                : "No live code found"}
            </span>
            <span className="text-xs text-muted-foreground max-w-xs">
              Deploy this website from the editor to publish the latest HTML.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveSite;
