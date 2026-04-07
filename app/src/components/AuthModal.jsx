import { useState } from "react";
import { useNavigate } from "react-router-dom";

// FIXED: calls POST /api/auth/login, stores real JWT token.
// Old version just saved "true" to localStorage without contacting the backend,
// meaning any email/password worked and all API calls returned 401 Unauthorized.
function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const navigate = useNavigate();
  const [mode,     setMode]     = useState("login");
  const [name,     setName]     = useState("");
  const [role,     setRole]     = useState("Sales Associate");
  const [shopName, setShopName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isSignup = mode === "signup";
      const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignup
        ? { name, email, password, role, shop_name: shopName }
        : { email, password };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Store JWT token and user info
      localStorage.setItem("rf_token", data.access_token);
      localStorage.setItem("rf_auth",  "true");
      localStorage.setItem("rf_user",  JSON.stringify(data.user));

      if (onLoginSuccess) onLoginSuccess();
      onClose();
      navigate("/dashboard");
    } catch {
      setError("Cannot reach server. Make sure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay active">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>{mode === "signup" ? "Create your RetailForecaster account" : "Log in to continue to RetailForecaster"}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option>Admin</option>
                <option>Store Manager</option>
                <option>Sales Associate</option>
                <option>Analyst</option>
              </select>
            </div>
          )}

          {mode === "signup" && (
            <div className="form-group">
              <label>{role === "Admin" ? "Shop Name (new shop)" : "Shop Name"}</label>
              <input
                type="text"
                required
                placeholder={role === "Admin" ? "e.g. City Central Store" : "Enter exact shop name"}
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="admin@retail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 2 }}>{error}</p>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (mode === "signup" ? "Creating account..." : "Logging in...") : (mode === "signup" ? "Sign Up" : "Log In")}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setName("");
              setRole("Sales Associate");
              setShopName("");
              setMode(mode === "signup" ? "login" : "signup");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#60a5fa",
              cursor: "pointer",
              padding: 0,
              fontSize: 13,
            }}
          >
            {mode === "signup" ? "Log In" : "Create account"}
          </button>
        </p>

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
          Demo: admin@retail.com / admin123
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
