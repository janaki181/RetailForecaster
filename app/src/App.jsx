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

function App() {
  const [showAuth, setShowAuth]           = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Restore session on page refresh
    if (localStorage.getItem("rf_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const openAuth  = () => setShowAuth(true);
  const closeAuth = () => setShowAuth(false);

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
        <Route path="/products"  element={<Products />}  />
        <Route path="/sales"     element={<Sales />}     />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/users"     element={<Users />}     />
        <Route path="/settings"  element={<Settings />}  />
      </Route>
    </Routes>
  );
}

export default App;
