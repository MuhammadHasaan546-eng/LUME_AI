import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Empty string => requests are same-origin relative (/api/...) and go
// through the Vite dev-server proxy, avoiding cert/CORS issues.
const BASE_URL = import.meta.env.VITE_BASE_URL || "";

const WEBSITE_API_URL = `${BASE_URL}/api/website`;

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.message || fallbackMessage;

export const generateWebsite = createAsyncThunk(
  "website/generateWebsite",
  async (prompt, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${WEBSITE_API_URL}/generate-website`,
        { prompt },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to generate website");
      console.error("Generate Website Error:", message);
      return rejectWithValue(message);
    }
  },
);

export const updateWebsite = createAsyncThunk(
  "website/updateWebsite",
  async ({ websiteId, prompt }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${WEBSITE_API_URL}/website-update`,
        { websiteId, prompt },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update website");
      console.error("Update Website Error:", message);
      return rejectWithValue(message);
    }
  },
);

/**
 * Persist the editor's current pageData (the JSON Single Source of Truth) for
 * a website. This is NOT an AI call — it is a direct save of the structured
 * page definition the user has been editing in the canvas. Free of charge.
 *
 * @param {string} websiteId - the website document id
 * @param {object} pageData  - the full pageData object (schemaVersion, meta,
 *                             header, sections[], footer)
 */
export const savePageData = createAsyncThunk(
  "website/savePageData",
  async ({ websiteId, pageData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${WEBSITE_API_URL}/website/save-page-data`,
        { websiteId, pageData },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to save page data");
      return rejectWithValue(message);
    }
  },
);

export const getUserWebsites = createAsyncThunk(
  "website/getUserWebsites",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${WEBSITE_API_URL}/websites`, {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch websites");
      console.error("Get User Websites Error:", message);
      return rejectWithValue(message);
    }
  },
);

export const getWebsiteById = createAsyncThunk(
  "website/getWebsiteById",
  async (websiteId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${WEBSITE_API_URL}/website/${websiteId}`, {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch website");
      console.error("Get Website By Id Error:", message);
      return rejectWithValue(message);
    }
  },
);

export const deleteWebsite = createAsyncThunk(
  "website/deleteWebsite",
  async (websiteId, { rejectWithValue }) => {
    try {
      const res = await axios.delete(
        `${WEBSITE_API_URL}/website/${websiteId}`,
        {
          withCredentials: true,
        },
      );
      return { ...res.data, websiteId };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete website");
      console.error("Delete Website Error:", message);
      return rejectWithValue(message);
    }
  },
);

export const deployWebsite = createAsyncThunk(
  "website/deployWebsite",
  async ({ websiteId, pageData }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${WEBSITE_API_URL}/website/${websiteId}/deploy`,
        { pageData },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to deploy website");
      console.error("Deploy Website Error:", message);
      return rejectWithValue(message);
    }
  },
);

export const getLiveWebsite = createAsyncThunk(
  "website/getLiveWebsite",
  async (websiteId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${WEBSITE_API_URL}/live-site/${websiteId}`);
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load live website");
      console.error("Get Live Website Error:", message);
      return rejectWithValue(message);
    }
  },
);

// PUBLIC — fetch all deployed websites for the public showcase gallery.
// No authentication required.
export const getShowcaseWebsites = createAsyncThunk(
  "website/getShowcaseWebsites",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${WEBSITE_API_URL}/showcase`);
      return res.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to load showcase websites",
      );
      console.error("Get Showcase Websites Error:", message);
      return rejectWithValue(message);
    }
  },
);
