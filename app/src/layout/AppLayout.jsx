import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("rf_user") || "null");
  const role = user?.role || "Sales Associate";
  const shopName = user?.shop || "Not linked";
  const roleKey = role.toLowerCase().replace(/\s+/g, "-");

  return (
    <>
      {isOpen && (
        <div
          className="overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <Sidebar closeSidebar={() => setIsOpen(false)} role={role} />
      </div>

      <div className="main-content">
        <div className="layout-topbar">
          <button
            className="menu-btn"
            onClick={() => setIsOpen(true)}
          >
            Features
          </button>

          <div className="profile-chip" aria-live="polite">
            <div className="profile-meta">
              <div className="profile-row">
                <span className="profile-label">Logged in as</span>
                <span className={`role-pill role-${roleKey}`}>{role}</span>
              </div>
              <span className="profile-shop">Shop: {shopName}</span>
            </div>
          </div>
        </div>

        <Outlet />
        <Footer />
      </div>
    </>
  );
}

export default AppLayout;
