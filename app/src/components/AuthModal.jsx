import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,12}$/;

  function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!passwordPattern.test(password)) {
      alert(
        "Password must be 8-12 characters with at least one uppercase letter, one lowercase letter, and one symbol."
      );
      return;
    }

    if (isSignup && password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Save auth
    localStorage.setItem("rf_auth", "true");

    // Notify App.jsx
    if (onLoginSuccess) {
      onLoginSuccess();
    }

    // Close modal
    onClose();

    // Navigate to dashboard
    navigate("/dashboard");
  }

  return (
    <div className="auth-overlay active">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>
          &times;
        </button>

        <div className="auth-header">
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p>
            {isSignup
              ? "Sign up to start forecasting smarter"
              : "Log in to continue to RetailForecaster"}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              required
              minLength={3}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={12}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,12}"
              title="8-12 characters with at least one uppercase letter, one lowercase letter, and one symbol."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                maxLength={12}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,12}"
                title="8-12 characters with at least one uppercase letter, one lowercase letter, and one symbol."
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </div>
          )}

          <button type="submit" className="auth-button">
            {isSignup ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="auth-toggle">
          {isSignup
            ? "Already have an account?"
            : "Don’t have an account?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;