import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import ChatWidget from "../chat/ChatWidget";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed navbar - already positioned in its component */}
      <Navbar />

      {/* Hero section background elements for specific pages */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-accent-light/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Main content with proper spacing */}
      <main className="flex-grow relative z-10 pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
