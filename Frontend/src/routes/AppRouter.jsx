import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "@/components/home/Layout";
import Home from "@/pages/public/Home";
import LoginModal from "@/components/Auth/LoginModal";
import { getCurrentUser } from "@/api/getUser";
import store from "@/store/store";
import { CheckAuth } from "@/components/Auth/CheckAuth";
import Dashboard from "@/pages/client/Dashboard";
import GeneratePage from "@/pages/client/Generate";

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
          element: (
            <CheckAuth>
              <LoginModal />
            </CheckAuth>
          ),
        },
      ],
    },
    {
      path: "dashboard",
      element: (
        // <CheckAuth>
        <Dashboard />
        // </CheckAuth>
      ),
    },
    {
      path: "generate",
      element: (
        // <CheckAuth>
        <GeneratePage />
        // </CheckAuth>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
};
