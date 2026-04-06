import { NavLink } from "react-router-dom";

// FIXED: closeSidebar prop is now called on every NavLink click.
// Old Sidebar received the prop but ignored it — sidebar never closed on mobile.
function Sidebar({ closeSidebar }) {
  const nav = () => { if (closeSidebar) closeSidebar(); };

  const handleLogout = () => {
    localStorage.removeItem("rf_token");
    localStorage.removeItem("rf_auth");
    localStorage.removeItem("rf_user");
    window.location.href = "/";
  };

  return (
    <nav className="sidebar-nav">
      <NavLink to="/dashboard" className="nav-item" onClick={nav}>📊 <span>Dashboard</span></NavLink>
      <NavLink to="/products"  className="nav-item" onClick={nav}>📦 <span>Products</span></NavLink>
      <NavLink to="/sales"     className="nav-item" onClick={nav}>🛒 <span>Sales</span></NavLink>
      <NavLink to="/analytics" className="nav-item" onClick={nav}>📈 <span>Analytics</span></NavLink>
      <NavLink to="/inventory" className="nav-item" onClick={nav}>⚠  <span>Inventory</span></NavLink>
      <NavLink to="/users"     className="nav-item" onClick={nav}>👥 <span>Users</span></NavLink>
      <NavLink to="/settings"  className="nav-item" onClick={nav}>⚙  <span>Settings</span></NavLink>
      <button onClick={handleLogout} className="nav-item logout">🚪 <span>Logout</span></button>
    </nav>
  );
}

export default Sidebar;
