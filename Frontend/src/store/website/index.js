import { createSlice } from "@reduxjs/toolkit";
import {
  deleteWebsite,
  deployWebsite,
  generateWebsite,
  getLiveWebsite,
  getShowcaseWebsites,
  getUserWebsites,
  getWebsiteById,
  savePageData,
  updateWebsite,
} from "@/api/website";

const initialState = {
  isLoading: false,
  error: null,
  successMessage: "",
  websiteId: "",
  title: "",
  // pageData is the JSON Single Source of Truth for the page being edited.
  // It is normalized by the Editor component before rendering.
  pageData: null,
  // latestCode is kept for backward compatibility with the legacy LiveSite
  // view (old websites that were stored as HTML). New websites use pageData.
  latestCode: "",
  deployed: false,
  deployedUrl: "",
  createdAt: "",
  updatedAt: "",
  credits: 0,
  websites: [],
  currentWebsite: null,
  // Public showcase gallery (all deployed websites)
  showcase: [],
  showcaseLoading: false,
  showcaseError: null,
  // Saving pageData (autosave) has its own lightweight status flags so the
  // editor can show a "Saving…" / "Saved" indicator without clobbering the
  // main isLoading flag used by AI generation.
  isSaving: false,
  saveError: null,
  lastSavedAt: null,
};

const applyWebsiteDetails = (state, payload) => {
  state.websiteId = payload.websiteId || payload._id || "";
  state.title = payload.title || "";
  // Prefer pageData; fall back to latestCode for legacy documents.
  state.pageData = payload.pageData || state.pageData || null;
  state.latestCode = payload.latestCode || "";
  state.deployed = Boolean(payload.deployed);
  state.deployedUrl = payload.deployedUrl || "";
  state.createdAt = payload.createdAt || "";
  state.updatedAt = payload.updatedAt || "";
  state.currentWebsite = payload;
};

const websiteSlice = createSlice({
  name: "website",
  initialState,
  reducers: {
    clearWebsiteError: (state) => {
      state.error = null;
    },
    clearWebsiteMessage: (state) => {
      state.successMessage = "";
    },
    /**
     * Optimistically update the in-memory pageData without a round-trip.
     * Used by the Editor so the canvas stays in sync with local edits while
     * a debounced savePageData call is in flight.
     */
    setPageData: (state, action) => {
      state.pageData = action.payload;
    },
    clearSaveStatus: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateWebsite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.successMessage =
          action.payload.message || "Website generated successfully";
        applyWebsiteDetails(state, action.payload.data);
        state.credits = action.payload.data.credits;
      })
      .addCase(generateWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to generate website";
      })
      .addCase(updateWebsite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.successMessage =
          action.payload.message || "Website updated successfully";
        applyWebsiteDetails(state, action.payload.data);
        state.credits = action.payload.data.credits ?? state.credits;
        state.websites = state.websites.map((website) =>
          website._id === action.payload.data.websiteId
            ? {
                ...website,
                title: action.payload.data.title,
                updatedAt: action.payload.data.updatedAt,
              }
            : website,
        );
      })
      .addCase(updateWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update website";
      })
      .addCase(getUserWebsites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserWebsites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.websites = action.payload.data || [];
      })
      .addCase(getUserWebsites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch websites";
      })
      .addCase(getWebsiteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWebsiteById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        applyWebsiteDetails(state, action.payload.data);
      })
      .addCase(getWebsiteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch website";
      })
      .addCase(deleteWebsite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.successMessage =
          action.payload.message || "Website deleted successfully";
        state.websites = state.websites.filter(
          (website) => website._id !== action.payload.websiteId,
        );

        if (state.websiteId === action.payload.websiteId) {
          state.websiteId = "";
          state.title = "";
          state.pageData = null;
          state.latestCode = "";
          state.createdAt = "";
          state.updatedAt = "";
          state.currentWebsite = null;
        }
      })
      .addCase(deleteWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete website";
      })
      .addCase(deployWebsite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deployWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.successMessage =
          action.payload.message || "Website deployed successfully";
        applyWebsiteDetails(state, action.payload.data);
        state.websites = state.websites.map((website) =>
          website._id === action.payload.data.websiteId ||
          website._id === action.payload.data._id
            ? {
                ...website,
                ...action.payload.data,
                _id: website._id,
              }
            : website,
        );
      })
      .addCase(deployWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to deploy website";
      })
      .addCase(getLiveWebsite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLiveWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        applyWebsiteDetails(state, action.payload.data);
      })
      .addCase(getLiveWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load live website";
      })
      // ── Public showcase gallery ──
      .addCase(getShowcaseWebsites.pending, (state) => {
        state.showcaseLoading = true;
        state.showcaseError = null;
      })
      .addCase(getShowcaseWebsites.fulfilled, (state, action) => {
        state.showcaseLoading = false;
        state.showcaseError = null;
        state.showcase = action.payload.data || [];
      })
      .addCase(getShowcaseWebsites.rejected, (state, action) => {
        state.showcaseLoading = false;
        state.showcaseError =
          action.payload || "Failed to load showcase websites";
      })
      // ── Save pageData (autosave from the Editor) ──
      .addCase(savePageData.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(savePageData.fulfilled, (state, action) => {
        state.isSaving = false;
        state.saveError = null;
        state.lastSavedAt = new Date().toISOString();
        // Keep the authoritative copy returned by the server in sync.
        if (action.payload?.data?.pageData) {
          state.pageData = action.payload.data.pageData;
        }
        if (action.payload?.data?.title) {
          state.title = action.payload.data.title;
        }
        state.updatedAt = action.payload?.data?.updatedAt || state.updatedAt;
        // Reflect the saved title in the websites list too.
        state.websites = state.websites.map((website) =>
          website._id === action.payload?.data?.websiteId
            ? {
                ...website,
                title: action.payload.data.title || website.title,
                updatedAt: action.payload.data.updatedAt || website.updatedAt,
              }
            : website,
        );
      })
      .addCase(savePageData.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload || "Failed to save page data";
      });
  },
});

export const {
  clearWebsiteError,
  clearWebsiteMessage,
  setPageData,
  clearSaveStatus,
} = websiteSlice.actions;

export default websiteSlice.reducer;
