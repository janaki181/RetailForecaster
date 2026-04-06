import { useState } from "react";
import { useNavigate } from "react-router-dom";

// FIXED: calls POST /api/auth/login, stores real JWT token.
// Old version just saved "true" to localStorage without contacting the backend,
// meaning any email/password worked and all API calls returned 401 Unauthorized.
function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const navigate = useNavigate();
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
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
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
          <p>Log in to continue to RetailForecaster</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
          Demo: admin@retail.com / admin123
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
