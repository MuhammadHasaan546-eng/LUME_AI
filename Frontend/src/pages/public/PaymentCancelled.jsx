import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { X, RotateCcw, HelpCircle } from "lucide-react";

// Custom slow elegant cubic bezier curve
const luxuryEase = [0.16, 1, 0.3, 1];

const PaymentCancelled = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear the cancelled query params so a refresh doesn't re-trigger the toast
    setSearchParams({}, { replace: true });
    toast.info("Stripe checkout was cancelled.");
  }, [setSearchParams]);

  const handleRetry = () => {
    navigate("/pricing");
  };

  const handleSupport = () => {
    navigate("/pricing");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#030303] text-zinc-900 dark:text-white flex items-center justify-center font-sans relative overflow-hidden select-none transition-colors duration-500">
      {/* Subtle Aesthetic Grid Lines Backdrop */}
      <div className="absolute inset-0 flex justify-between px-[15%] opacity-[0.03] dark:opacity-[0.04] pointer-events-none z-0">
        <div className="w-[1px] h-full bg-zinc-900 dark:bg-white" />
        <div className="w-[1px] h-full bg-zinc-900 dark:bg-white" />
        <div className="w-[1px] h-full bg-zinc-900 dark:bg-white" />
      </div>

      {/* Decorative center radial glow */}
      <div className="absolute w-[500px] h-[500px] bg-red-500/[0.04] dark:bg-red-500/[0.03] blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: luxuryEase }}
        className="w-full max-w-md bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-white/[0.04] rounded-2xl p-8 mx-4 relative z-10 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50"
      >
        {/* Top Minimal Cancelled Indicator */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 flex items-center justify-center mb-5">
            {/* Pulsing ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: luxuryEase }}
              className="absolute inset-0 border border-red-500/20 dark:border-red-500/15 rounded-full"
            />
            {/* Micro rotating dashed ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                repeat: Infinity,
                duration: 25,
                ease: "linear",
              }}
              className="absolute inset-1 border border-dashed border-zinc-300 dark:border-white/[0.05] rounded-full"
            />
            {/* Core X Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeInOut" }}
              className="w-6 h-6 text-red-500 dark:text-red-500"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 font-mono mb-1"
          >
            Transaction Aborted
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: luxuryEase }}
            className="text-2xl font-extralight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 dark:from-white to-zinc-500 dark:to-[#a3a3a3]"
          >
            Payment Cancelled
          </motion.h1>
        </div>

        {/* Details Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="space-y-4 border-t border-b border-zinc-200 dark:border-white/[0.04] py-6 mb-8 text-xs font-light"
        >
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#737373] tracking-wide">
              Status
            </span>
            <span className="inline-flex items-center gap-1.5 text-red-500 dark:text-red-500 font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Cancelled
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#737373] tracking-wide">
              Amount
            </span>
            <span className="text-zinc-600 dark:text-[#a3a3a3] font-mono tracking-wider">
              $0.00
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#737373] tracking-wide">
              Charged
            </span>
            <span className="text-zinc-800 dark:text-[#e5e5e5] tracking-wide font-normal">
              No charge applied
            </span>
          </div>
        </motion.div>

        {/* CTA Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: luxuryEase }}
        >
          <button
            onClick={handleRetry}
            className="w-full relative group overflow-hidden bg-zinc-950 dark:bg-white text-white dark:text-black font-normal tracking-[0.15em] text-[11px] uppercase py-3.5 rounded-lg transition-all duration-300 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Back to Pricing
          </button>

          <button
            onClick={handleSupport}
            className="w-full text-center text-[10px] text-zinc-400 dark:text-[#525252] hover:text-zinc-600 dark:hover:text-[#a3a3a3] uppercase tracking-[0.2em] mt-4 block transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-3 h-3" />
            Need Help? Contact Support
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentCancelled;
