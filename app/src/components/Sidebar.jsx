import { NavLink } from "react-router-dom";

// FIXED: closeSidebar prop is now called on every NavLink click.
// Old Sidebar received the prop but ignored it — sidebar never closed on mobile.
function Sidebar({ closeSidebar, role = "Sales Associate" }) {
  const nav = () => { if (closeSidebar) closeSidebar(); };

  const canView = {
    dashboard: true,
    products: ["Admin", "Store Manager", "Inventory Lead", "Analyst"].includes(role),
    sales: ["Admin", "Store Manager", "Sales Associate"].includes(role),
    analytics: ["Admin", "Store Manager", "Analyst"].includes(role),
    inventory: ["Admin", "Store Manager", "Inventory Lead"].includes(role),
    users: role === "Admin",
    settings: role === "Admin",
  };

  const handleLogout = () => {
    localStorage.removeItem("rf_token");
    localStorage.removeItem("rf_auth");
    localStorage.removeItem("rf_user");
    window.location.href = "/";
  };

  return (
    <nav className="sidebar-nav">
      {canView.dashboard && <NavLink to="/dashboard" className="nav-item" onClick={nav}>📊 <span>Dashboard</span></NavLink>}
      {canView.products && <NavLink to="/products"  className="nav-item" onClick={nav}>📦 <span>Products</span></NavLink>}
      {canView.sales && <NavLink to="/sales"     className="nav-item" onClick={nav}>🛒 <span>Sales</span></NavLink>}
      {canView.analytics && <NavLink to="/analytics" className="nav-item" onClick={nav}>📈 <span>Analytics</span></NavLink>}
      {canView.inventory && <NavLink to="/inventory" className="nav-item" onClick={nav}>⚠  <span>Inventory</span></NavLink>}
      {canView.users && <NavLink to="/users"     className="nav-item" onClick={nav}>👥 <span>Users</span></NavLink>}
      {canView.settings && <NavLink to="/settings"  className="nav-item" onClick={nav}>⚙  <span>Settings</span></NavLink>}
      <button onClick={handleLogout} className="nav-item logout">🚪 <span>Logout</span></button>
    </nav>
  );
}

export default Sidebar;
