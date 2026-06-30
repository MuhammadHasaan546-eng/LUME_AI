import React, { useEffect } from "react";
import LoginModal from "./LoginModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import LumeMotionLoader from "@/routes/pageLoader";

/**
 * Auth guard component.
 *
 * @param {React.ReactNode} children - The protected page content.
 * @param {boolean} requireAuth - If true, the route requires authentication
 *   (e.g. /dashboard, /generate, /editor). If false, the route is public-only
 *   (e.g. /login) and authenticated users are redirected away.
 */
export const CheckAuth = ({ children, requireAuth = true }) => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect authenticated users away from public-only routes (e.g. /login).
  // Redirect unauthenticated users away from protected routes.
  // IMPORTANT: navigation must happen inside useEffect, never during render.
  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // Protected route + not logged in — let the LoginModal render below.
      return;
    }

    if (!requireAuth && isAuthenticated) {
      // Public-only route (e.g. /login) but user is logged in — send to dashboard.
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, requireAuth, navigate]);

  if (isLoading) {
    return <LumeMotionLoader isLoading={isLoading} />;
  }

  // Protected route: show login modal when not authenticated, otherwise children.
  if (requireAuth) {
    if (!isAuthenticated) {
      return <LoginModal defaultOpen={true} />;
    }
    return children;
  }

  // Public-only route (e.g. /login): show children when not authenticated.
  // (Authenticated users are redirected via the effect above; show loader meanwhile.)
  if (isAuthenticated) {
    return <LumeMotionLoader isLoading={true} />;
  }
  return children;
};
