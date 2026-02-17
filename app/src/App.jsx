import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Aim from "./components/Aim";
import Features from "./components/Features";
import Impact from "./components/Impact";
import DashboardPreview from "./components/DashboardPreview";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";

import Dashboard from "./pages/Dashboard";

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check login on refresh
  useEffect(() => {
    const auth = localStorage.getItem("rf_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const openAuth = () => setShowAuth(true);
  const closeAuth = () => setShowAuth(false);

  return (
    <Routes>

      {/* LANDING PAGE */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <>
              <Header onLoginClick={openAuth} />
              <Hero onLoginClick={openAuth} />
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

      {/* PROTECTED DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard />
          ) : (
            <Navigate to="/" />
          )
        }
      />

    </Routes>
  );
}

export default App;