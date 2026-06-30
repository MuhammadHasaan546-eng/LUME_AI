import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Empty string => requests are same-origin relative (/api/...) and go
// through the Vite dev-server proxy, avoiding cert/CORS issues.
const BASE_URL = import.meta.env.VITE_BASE_URL || "";

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/me`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch user.";
      console.error("Get Current User Error:", message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);
