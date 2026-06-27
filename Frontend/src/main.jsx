import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store/store";

import { Toaster } from "./components/ui/sonner";
import App from "./App";
import ThemeStoreSync from "./components/home/ThemeStoreSync";
import SmoothScroll from "./components/home/SmoothScroll";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        storageKey="lume-theme"
        enableSystem
        disableTransitionOnChange
      >
        <SmoothScroll>
          <ThemeStoreSync />
          <App />
          <Toaster />
        </SmoothScroll>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
