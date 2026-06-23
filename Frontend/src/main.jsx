import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store/store";

import { Toaster } from "./components/ui/sonner";
import { AppRouter } from "./routes/AppRouter";
import ThemeStoreSync from "./components/home/ThemeStoreSync";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <ThemeStoreSync />
        <AppRouter />
        <Toaster />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
