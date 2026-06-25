import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "@/components/home/Layout";
import Home from "@/pages/public/Home";
import LoginModal from "@/components/Auth/LoginModal";
import { getCurrentUser } from "@/api/getUser";
import store from "@/store/store";
import { CheckAuth } from "@/components/Auth/CheckAuth";
import Dashboard from "@/pages/client/Dashboard";
import GeneratePage from "@/pages/client/Generate";
import EditorPage from "@/pages/client/Editer";
import LiveSite from "@/pages/public/LiveSite";
import Price from "@/pages/public/Price";

// 1. Loading component
const PageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <h3>Loading App...</h3>
  </div>
);

export const AppRouter = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      HydrateFallback: PageLoader,
      children: [
        {
          index: true,
          element: <Home />,
          loader: async () => {
            try {
              await store.dispatch(getCurrentUser()).unwrap();
            } catch (error) {
              console.log("User not logged in", error);
            }
            return null;
          },
        },
        {
          path: "pricing",
          element: <Price />,
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
      element: <Dashboard />,
    },
    {
      path: "generate",
      element: <GeneratePage />,
    },
    {
      path: "editor/:codeId",
      element: <EditorPage />,
    },
    {
      path: "live-site/:websiteId",
      element: <LiveSite />,
    },
  ]);

  return <RouterProvider router={router} fallbackElement={<PageLoader />} />;
};
