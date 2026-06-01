import { ArrowLeft, Plus } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const navigate = useNavigate();
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-black text-white px-4 py-3 flex items-center justify-between shadow-md"
    >
      {/* LEFT SIDE: Animated Back Arrow */}
      <div className="flex items-center">
        <motion.button
          whileHover={{ x: -4, color: "#ffffff" }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="text-gray-400 p-1 rounded-full hover:bg-zinc-900 transition-colors flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" onClick={() => navigate("/")} />
        </motion.button>
      </div>

      {/* RIGHT SIDE: Animated Create New Project Button */}
      <div className="flex items-center">
        <motion.button
          onClick={() => navigate("/generate")}
          whileHover={{ scale: 1.03, backgroundColor: "#27272a" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="bg-zinc-800 text-white text-xs md:text-sm font-medium px-3 py-1.5 rounded border border-zinc-700 shadow-sm flex items-center gap-1.5"
        >
          <motion.span
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </motion.span>
          New Project
        </motion.button>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;
