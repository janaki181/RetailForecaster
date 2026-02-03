import { useState } from "react";

function AuthModal({ isOpen, onClose }) {
  const [isSignup, setIsSignup] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (isSignup && password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    localStorage.setItem("rf_auth", "true");
    onClose();
    alert("Logged in successfully 🚀");
  }

  return (
    <div className="auth-overlay active">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>

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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button className="auth-button">
            {isSignup ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="auth-toggle">
          {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
