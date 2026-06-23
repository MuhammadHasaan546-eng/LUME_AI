import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./AuthSlice";
import websiteReducer from "./website";

const store = configureStore({
  reducer: {
    auth: authReducer,
    website: websiteReducer,
  },
});

export default store;
