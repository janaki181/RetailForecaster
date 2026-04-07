import "./App.css";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header          from "./components/Header";
import Hero            from "./components/Hero";
import Aim             from "./components/Aim";
import Features        from "./components/Features";
import Impact          from "./components/Impact";
import DashboardPreview from "./components/DashboardPreview";
import Footer          from "./components/Footer";
import AuthModal       from "./components/AuthModal";

import AppLayout  from "./layout/AppLayout";
import Dashboard  from "./pages/Dashboard";
import Products   from "./pages/Products";
import Sales      from "./pages/Sales";
import Analytics  from "./pages/Analytics";
import Inventory  from "./pages/Inventory";
import Users      from "./pages/Users";
import Settings   from "./pages/Settings";

const ROLE_ACCESS = {
  dashboard: ["Admin", "Store Manager", "Sales Associate", "Inventory Lead", "Analyst"],
  products: ["Admin", "Store Manager", "Inventory Lead", "Analyst"],
  sales: ["Admin", "Store Manager", "Sales Associate"],
  analytics: ["Admin", "Store Manager", "Analyst"],
  inventory: ["Admin", "Store Manager", "Inventory Lead"],
  users: ["Admin"],
  settings: ["Admin"],
};

function App() {
  const [showAuth, setShowAuth]           = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("Sales Associate");

  useEffect(() => {
    // Restore session on page refresh
    if (localStorage.getItem("rf_auth") === "true") {
      setIsAuthenticated(true);
      const user = JSON.parse(localStorage.getItem("rf_user") || "null");
      setRole(user?.role || "Sales Associate");
    }
  }, []);

  const openAuth  = () => setShowAuth(true);
  const closeAuth = () => setShowAuth(false);

  const can = (key) => ROLE_ACCESS[key]?.includes(role);

  return (
    <Routes>
      {/* ── LANDING PAGE ─────────────────────────────── */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <>
              <Header onLoginClick={openAuth} />
              <Hero    onLoginClick={openAuth} />
              <Aim />
              <Features />
              <Impact />
              <DashboardPreview onLoginClick={openAuth} />
              <Footer />
              <AuthModal
                isOpen={showAuth}
                onClose={closeAuth}
                onLoginSuccess={() => setIsAuthenticated(true)}
              />
            </>
          )
        }
      />

      {/* ── PROTECTED APP ROUTES ─────────────────────── */}
      <Route
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/" replace />
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products"  element={can("products") ? <Products /> : <Navigate to="/dashboard" replace />}  />
        <Route path="/sales"     element={can("sales") ? <Sales /> : <Navigate to="/dashboard" replace />}     />
        <Route path="/analytics" element={can("analytics") ? <Analytics /> : <Navigate to="/dashboard" replace />} />
        <Route path="/inventory" element={can("inventory") ? <Inventory /> : <Navigate to="/dashboard" replace />} />
        <Route path="/users"     element={can("users") ? <Users /> : <Navigate to="/dashboard" replace />}     />
        <Route path="/settings"  element={can("settings") ? <Settings /> : <Navigate to="/dashboard" replace />}  />
      </Route>
    </Routes>
  );
}

export default App;
