import React from "react";
import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden relative">
      <Header />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
