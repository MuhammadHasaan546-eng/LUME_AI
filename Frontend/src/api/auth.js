import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/google`, userData, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        console.log(res.data.token);
      }

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Server connect nahi ho raha!";

      console.error("Login Error:", message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);
