import { createSlice } from "@reduxjs/toolkit";

const THEME_OPTIONS = ["light", "dark", "system"];

const getStoredTheme = () => {
  const storedTheme = localStorage.getItem("lume-theme");
  return THEME_OPTIONS.includes(storedTheme) ? storedTheme : "system";
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const initialTheme = getStoredTheme();

const initialState = {
  selectedTheme: initialTheme,
  resolvedTheme: initialTheme === "system" ? getSystemTheme() : initialTheme,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemePreference: (state, action) => {
      const theme = THEME_OPTIONS.includes(action.payload)
        ? action.payload
        : "system";
      state.selectedTheme = theme;
      localStorage.setItem("lume-theme", theme);
    },
    setResolvedTheme: (state, action) => {
      state.resolvedTheme = action.payload;
    },
  },
});

export const { setThemePreference, setResolvedTheme } = themeSlice.actions;

export default themeSlice.reducer;
