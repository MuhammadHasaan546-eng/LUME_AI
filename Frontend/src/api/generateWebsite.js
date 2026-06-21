import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const generateWebsite = async (prompt) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/website/generate-website`,
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
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to generate website";
    console.error("Generate Website Error:", message);
    throw new Error(message);
  }
};
