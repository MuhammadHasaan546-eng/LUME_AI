import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

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
