import { useState } from "react";
import { Routes, Route } from "react-router-dom";

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

  const openAuth = () => setShowAuth(true);
  const closeAuth = () => setShowAuth(false);

  return (
    <>
      <Routes>
        {/* LANDING PAGE */}
        <Route
          path="/"
          element={
            <>
              <Header onLoginClick={openAuth} />
              <Hero onLoginClick={openAuth} />
              <Aim />
              <Features />
              <Impact />
              <DashboardPreview onLoginClick={openAuth} />
              <Footer />

              <AuthModal isOpen={showAuth} onClose={closeAuth} />
            </>
          }
        />

        {/* DASHBOARD PAGE */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
