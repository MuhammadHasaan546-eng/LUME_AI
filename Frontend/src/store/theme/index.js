import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedTheme: localStorage.getItem("lume-theme") || "dark",
  resolvedTheme: "dark",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemePreference: (state, action) => {
      state.selectedTheme = action.payload;
      localStorage.setItem("lume-theme", action.payload);
    },
    setResolvedTheme: (state, action) => {
      state.resolvedTheme = action.payload;
    },
  },
});

export const { setThemePreference, setResolvedTheme } = themeSlice.actions;

export default themeSlice.reducer;
