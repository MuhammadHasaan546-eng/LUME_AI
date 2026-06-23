import React, { useState } from "react";
import { ArrowLeft, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { generateWebsite } from "@/api/website";
import { clearWebsiteError } from "@/store/website";

const GeneratePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.website);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    dispatch(clearWebsiteError());

    try {
      const response = await dispatch(generateWebsite(trimmedPrompt)).unwrap();
      const websiteId = response?.data?.websiteId || response?.data?._id;

      if (!websiteId) {
        throw new Error("Website generated, but website id was not returned.");
      }

      toast.success(response.message || "Website generated successfully!");
      navigate(`/editor/${websiteId}`);
    } catch (err) {
      toast.error(err?.message || err || "Failed to generate website.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-900 bg-[#0C0C0C] p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#4C7294]/20 bg-[#4C7294]/10 px-3 py-1 text-xs text-[#8eb6d8]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Website Generator
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Describe your website
          </h1>
          <p className="text-sm leading-6 text-zinc-500">
            Generate your first version here. After generation, you will be
            redirected to the editor URL with the website id, where you can make
            more changes and update the same website.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Example: Build a modern responsive portfolio website with home, about, services, and contact pages."
            className="w-full resize-none rounded-xl border border-zinc-800 bg-[#090909] p-4 text-sm text-zinc-200 outline-none transition focus:border-[#4C7294] focus:ring-1 focus:ring-[#4C7294]/40"
          />

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4C7294] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#426482] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating website...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate and open editor
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GeneratePage;
