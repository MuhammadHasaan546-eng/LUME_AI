import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["ai", "user"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const websiteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    // ── pageData: the JSON Single Source of Truth ──
    // Structured page definition (schemaVersion, meta, header, sections[],
    // footer). The frontend Editor reads/writes this object directly. It is
    // rendered both in-app (Canvas) and inside the WebContainer Vite project.
    pageData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // ── latestCode: legacy/derived HTML string ──
    // Kept for backward compatibility (old LiveSite.jsx renders this directly).
    // No longer required — new websites are driven by pageData.
    latestCode: {
      type: String,
      required: false,
      default: "",
    },

    conversations: [messageSchema],

    deployed: {
      type: Boolean,
      default: false,
    },
    deployedUrl: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },

  {
    timestamps: true,
  },
);
const Website = mongoose.model("Website", websiteSchema);
export default Website;
