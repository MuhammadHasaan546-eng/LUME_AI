import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getLiveWebsite } from "@/api/website";
import { Globe2 } from "lucide-react";
import LumeMotionLoader from "@/routes/pageLoader";
import Canvas from "@/editor/Canvas";

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

  if (isLoading) {
    return <LumeMotionLoader isLoading={isLoading} />;
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
    <div className="w-full min-h-screen overflow-y-auto bg-black relative select-none">
      {/* The Actual Live Generated Website — rendered through the same typed
          Canvas / section components used in the editor. No iframe, no
          in-browser Babel, no CDN scripts. */}
      <Canvas pageData={currentSite?.pageData} device="desktop" />

      {/* Luxury Minimalist Brand Watermark / Footer Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 right-4 z-50 pointer-events-auto"
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
