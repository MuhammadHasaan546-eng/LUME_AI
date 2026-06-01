import React from "react";
import LoginModal from "./LoginModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

export const CheckAuth = ({ children }) => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, user } = useSelector(
    (state) => state.auth,
  );

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
  //     </div>
  //   );
  // }

  if (!isAuthenticated) {
    return <LoginModal />;
  }
  if (isAuthenticated) {
    navigate("/dashboard");
    return children;
  }
};
