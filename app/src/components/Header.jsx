import logo from "../assets/logo.jpeg";

function Header({ onLoginClick }) {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <img src={logo} className="logo-img" />
          <span className="logo-text">RetailForecaster</span>
        </div>

        <nav className="nav">
          <a href="#home" className="nav-link">Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#impact" className="nav-link">Impact</a>
          <a href="#dashboard" className="nav-link">Dashboard</a>

          <button
            type="button"
            className="nav-link login-btn"
            onClick={onLoginClick}
          >
            Login
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;