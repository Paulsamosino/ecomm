import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "../chat/ChatWidget";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Layout;
