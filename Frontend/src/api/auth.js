import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Empty string => requests are same-origin relative (/api/...) and go
// through the Vite dev-server proxy, avoiding cert/CORS issues.
const BASE_URL = import.meta.env.VITE_BASE_URL || "";

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

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    const message = error.response.data.message || "Server side error";

    return thunkAPI.rejectWithValue(message);
  }
});
