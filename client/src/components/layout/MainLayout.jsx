import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import ChatWidget from "../chat/ChatWidget";
import { Egg, Wheat, Sun } from "lucide-react";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      {/* Farm-themed background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat opacity-5"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjZmM5ODMwIiBmaWxsLW9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6Ii8+PHBhdGggZD0iTTIwIDBoMjB2MjBIMjB6Ii8+PHBhdGggZD0iTTAgMjBoMjB2MjBIMHoiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6Ii8+PC9nPjwvc3ZnPg==')",
          }}
        />
        <div className="absolute top-20 -right-20 w-64 h-64 bg-orange-400/10 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Fixed navbar - already positioned in its component */}
      <Navbar />

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
