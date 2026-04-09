import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

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
      console.log(res.data);
      return res.data;
    } catch (error) {
      const message = error.response.data.message || error.message;
      console.error("Login Error:", message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);
