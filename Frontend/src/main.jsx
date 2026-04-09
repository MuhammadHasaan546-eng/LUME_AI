import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import "./index.css";
import Layout from "./components/home/Layout.jsx";
import Home from "./pages/home/Home.jsx";
import LoginModal from "./components/Auth/LoginModal";
import { Provider } from "react-redux";
import store from "./store/store";
import { getCurrentUser } from "./api/getUser";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          store.dispatch(getCurrentUser());
        },
      },
      {
        path: "/login",
        element: <LoginModal />,
      },
      // {
      //   path: "dashboard",
      //   element: <Dashboard />,
      //   loader: async () => {
      //     return fetch("/api/user-data");
      //   },
      // },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
