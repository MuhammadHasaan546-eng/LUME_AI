import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "@/components/home/Layout";
import Home from "@/pages/public/Home";
import LoginModal from "@/components/Auth/LoginModal";
import { getCurrentUser } from "@/api/getUser";
import store from "@/store/store";

export const AppRouter = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Home />,
          loader: async () => {
            await store.dispatch(getCurrentUser());
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

  return <RouterProvider router={router} />;
};
