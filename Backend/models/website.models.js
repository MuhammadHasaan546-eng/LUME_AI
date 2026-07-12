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

    // ── Soft-delete ──
    // Projects are never hard-removed from the database. Instead we flip
    // isDeleted=true and stamp deletedAt. A global pre-find hook (below)
    // automatically excludes soft-deleted documents from EVERY read query
    // (dashboard list, showcase gallery, live-site, editor, deploy, update),
    // so they vanish from the UI while the data is retained for audit,
    // analytics, and accidental-deletion recovery.
    //
    // Cascading: conversations[] and pageData are EMBEDDED sub-documents of
    // the Website, so soft-deleting the parent inherently hides (and later
    // purges) all of its associated data — no separate Task/Asset/Role
    // collections exist to orphan. If standalone collections are added
    // later, cascade their soft-delete from the deleteWebsite controller.
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

// Auto-exclude soft-deleted documents from every find / findOne / findById
// (and the findOne*/findById* update & delete variants). A caller that
// genuinely needs to read soft-deleted docs — e.g. the delete controller
// performing an idempotent re-delete — passes an explicit `isDeleted`
// condition in its filter, which this hook respects and skips.
websiteSchema.pre(/^find/, function (next) {
  const filter = this.getFilter();
  if (filter.isDeleted !== undefined) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

const Website = mongoose.model("Website", websiteSchema);
export default Website;
