import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "@/components/home/Layout";
import Home from "@/pages/public/Home";
import LoginModal from "@/components/Auth/LoginModal";
import { CheckAuth } from "@/components/Auth/CheckAuth";
import Dashboard from "@/pages/client/Dashboard";
import GeneratePage from "@/pages/client/Generate";
import EditorPage from "@/pages/client/Editer";
import LiveSite from "@/pages/public/LiveSite";
import Price from "@/pages/public/Price";
import { authLoader } from "@/utils/authLoader";
import LumeMotionLoader from "./pageLoader";
import LumeNotFound from "@/pages/public/LumeNotFound";

// 1. Loading component
// const PageLoader = () => (
//   <div
//     style={{
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       height: "100vh",
//     }}
//   >
//     <h3>Loading App...</h3>
//   </div>
// );

export const AppRouter = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      HydrateFallback: LumeMotionLoader,
      children: [
        {
          index: true,
          element: <Home />,
          loader: authLoader,
        },
        {
          path: "pricing",
          element: <Price />,
          loader: authLoader,
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
      loader: authLoader,
    },
    {
      path: "generate",
      element: <GeneratePage />,
      loader: authLoader,
    },
    {
      path: "editor/:codeId",
      element: <EditorPage />,
      loader: authLoader,
    },
    {
      path: "live-site/:websiteId",
      element: <LiveSite />,
      loader: authLoader,
    },

    { path: "*", element: <LumeNotFound /> },
  ]);

  return (
    <RouterProvider router={router} fallbackElement={<LumeMotionLoader />} />
  );
};
