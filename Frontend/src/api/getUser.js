import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/user/me`, {
        headers: {
          "Content-Type": "application/json",
          // Agar cookie fail ho, to header se token mil jaye
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch user.";
      return thunkAPI.rejectWithValue(message);
    }
  },
);
