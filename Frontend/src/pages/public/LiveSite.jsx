import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getLiveWebsite } from "@/api/website";
import { Loader2, Globe2 } from "lucide-react";

const buildPreviewSrcDoc = (code = "") => {
  const fallbackPreview = `
    <div style="height:100vh;display:grid;place-items:center;background:#000000;color:#ffffff;font-family:system-ui,sans-serif;text-align:center;padding:24px;">
      <div>
        <div style="font-size:32px;margin-bottom:12px;">✨</div>
        <strong style="font-size:20px;letter-spacing:1px;">LUME.AI SITE</strong>
        <p style="margin:8px 0 0;color:#a1a1aa;font-size:14px;">This website live view is being prepared.</p>
      </div>
    </div>`;

  const safeCode = code?.trim() || fallbackPreview;
  const liveGuard = `
<base href="about:srcdoc">
<script>
  (function () {
    document.addEventListener('submit', function (event) {
      event.preventDefault();
    }, true);
  })();
</script>`;

  if (/<head[\s>]/i.test(safeCode)) {
    return safeCode.replace(/<head([^>]*)>/i, `<head$1>${liveGuard}`);
  }

  return `${liveGuard}${safeCode}`;
};

const LiveSiteView = () => {
  const { websiteId } = useParams();
  const dispatch = useDispatch();

  const { currentWebsite, isLoading, error } = useSelector(
    (state) => state.website,
  );

  useEffect(() => {
    if (websiteId) {
      dispatch(getLiveWebsite(websiteId));
    }
  }, [dispatch, websiteId]);

  const currentSite = useMemo(() => {
    if (!currentWebsite) return null;

    const currentId = currentWebsite._id || currentWebsite.websiteId;
    return currentId === websiteId ? currentWebsite : null;
  }, [currentWebsite, websiteId]);

  const srcDoc = useMemo(
    () => buildPreviewSrcDoc(currentSite?.latestCode),
    [currentSite?.latestCode],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black grid place-items-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
            Loading Live Space
          </p>
        </div>
      </div>
    );
  }

  if (error || (!isLoading && !currentSite)) {
    return (
      <div className="min-h-screen bg-black grid place-items-center text-center p-6">
        <div className="max-w-sm space-y-3">
          <div className="text-zinc-600 text-3xl">✕</div>
          <h4 className="text-lg font-bold text-white tracking-tight">
            Site Unreachable
          </h4>
          <p className="text-sm text-zinc-400">
            The website you are trying to view does not exist or hasn't been
            deployed yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-black relative select-none">
      {/* The Actual Live Generated Website Rendering Frame */}
      <iframe
        srcDoc={srcDoc}
        title={currentSite.title || "Live Website"}
        sandbox="allow-scripts allow-forms allow-modals allow-popups"
        className="w-full h-full border-0 m-0 p-0 bg-white"
        importance="high"
      />

      {/* Luxury Minimalist Brand Watermark / Footer Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-4 right-4 z-50 pointer-events-auto"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800/80 bg-black/80 backdrop-blur-md shadow-lg shadow-black/50">
          <Globe2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
            Built with{" "}
            <span className="text-white font-black tracking-normal">
              Lume.ai
            </span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveSiteView;
