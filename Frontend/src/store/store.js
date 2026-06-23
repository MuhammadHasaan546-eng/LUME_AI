import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./AuthSlice";
import websiteReducer from "./website";
import themeReducer from "./theme";

const store = configureStore({
  reducer: {
    auth: authReducer,
    website: websiteReducer,
    theme: themeReducer,
  },
});

export default store;
