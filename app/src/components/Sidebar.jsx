import { NavLink } from "react-router-dom";

function Sidebar() {

  const handleLogout = () => {
    localStorage.removeItem("rf_auth");
    window.location.href = "/"; // hard reset
  };

  return (
    <nav className="sidebar-nav">
      <NavLink to="/dashboard" className="nav-item">
        📊 <span>Dashboard</span>
      </NavLink>

      <NavLink to="/products" className="nav-item">
        📦 <span>Products</span>
      </NavLink>

      <NavLink to="/sales" className="nav-item">
        🛒 <span>Sales</span>
      </NavLink>

      <NavLink to="/analytics" className="nav-item">
        📈 <span>Analytics</span>
      </NavLink>

      <NavLink to="/inventory" className="nav-item">
        ⚠ <span>Inventory</span>
      </NavLink>

      <NavLink to="/users" className="nav-item">
        👥 <span>Users</span>
      </NavLink>

      <NavLink to="/settings" className="nav-item">
        ⚙ <span>Settings</span>
      </NavLink>

      <button onClick={handleLogout} className="nav-item logout">
        🚪 <span>Logout</span>
      </button>
    </nav>
  );
}

export default Sidebar;