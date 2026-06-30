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
import Features from "@/pages/public/Features";
import Showcase from "@/pages/public/Showcase";
import Docs from "@/pages/public/Docs";
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

const router = createBrowserRouter([
  {
    HydrateFallback: LumeMotionLoader,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Home />,
            loader: authLoader,
          },
          {
            path: "features",
            element: <Features />,
            loader: authLoader,
          },
          {
            path: "showcase",
            element: <Showcase />,
            loader: authLoader,
          },
          {
            path: "docs",
            element: <Docs />,
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
              <CheckAuth requireAuth={false}>
                <LoginModal defaultOpen={true} />
              </CheckAuth>
            ),
          },
        ],
      },
      {
        path: "dashboard",
        element: (
          <CheckAuth>
            <Dashboard />
          </CheckAuth>
        ),
        loader: authLoader,
      },
      {
        path: "generate",
        element: (
          <CheckAuth>
            <GeneratePage />
          </CheckAuth>
        ),
        loader: authLoader,
      },
      {
        path: "editor/:codeId",
        element: (
          <CheckAuth>
            <EditorPage />
          </CheckAuth>
        ),
        loader: authLoader,
      },
      {
        path: "live-site/:websiteId",
        element: <LiveSite />,
        loader: authLoader,
      },
      { path: "*", element: <LumeNotFound /> },
    ],
  },
]);

export const AppRouter = () => {
  return (
    <RouterProvider router={router} fallbackElement={<LumeMotionLoader />} />
  );
};
