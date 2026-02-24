import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <Sidebar closeSidebar={() => setIsOpen(false)} />
      </div>

      <div className="main-content">
        <button
          className="menu-btn"
          onClick={() => setIsOpen(true)}
        >
          ☰
        </button>

        <Outlet />
        <Footer />
      </div>
    </>
  );
}

export default AppLayout;
