import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import "./index.css";
import Layout from "./components/home/Layout.jsx";
import Home from "./pages/home/Home.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
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
    <ThemeProvider attribute="class" defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
