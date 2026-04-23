import { NavLink } from "react-router-dom";

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

  const navLinks = [
    { key: "dashboard", to: "/dashboard", icon: "📊", label: "Dashboard" },
    { key: "products", to: "/products", icon: "📦", label: "Products" },
    { key: "sales", to: "/sales", icon: "🛒", label: "Sales" },
    { key: "analytics", to: "/analytics", icon: "📈", label: "Analytics" },
    { key: "inventory", to: "/inventory", icon: "⚠️", label: "Inventory" },
    { key: "users", to: "/users", icon: "👥", label: "Users" },
    { key: "settings", to: "/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <>
      <style>{`
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 4px 28px;
          border-bottom: 1px solid rgba(167, 139, 250, 0.2);
          margin-bottom: 8px;
        }
        .sidebar-brand-icon {
          font-size: 22px;
          line-height: 1;
        }
        .sidebar-brand-text {
          font-size: 15px;
          font-weight: 700;
          background: linear-gradient(135deg, #c4b5fd, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.3px;
        }
        .rf-nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          color: rgba(196, 181, 253, 0.75);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.18s ease;
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .rf-nav-item:hover {
          background: rgba(139, 92, 246, 0.15);
          color: #e9d5ff;
          border-color: rgba(139, 92, 246, 0.25);
        }
        .rf-nav-item.active {
          background: linear-gradient(135deg, rgba(99, 62, 211, 0.55), rgba(79, 70, 229, 0.45));
          color: #ede9fe;
          border-color: rgba(167, 139, 250, 0.4);
          box-shadow: 0 2px 12px rgba(99, 62, 211, 0.3);
        }
        .rf-nav-item .nav-icon {
          font-size: 15px;
          line-height: 1;
          flex-shrink: 0;
        }
        .rf-nav-item .nav-label {
          flex: 1;
        }
        .rf-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: linear-gradient(180deg, #a78bfa, #6366f1);
          border-radius: 0 2px 2px 0;
        }
        .rf-logout-btn {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 14px;
          border-radius: 10px;
          color: rgba(252, 165, 165, 0.75);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          border: 1px solid transparent;
          width: 100%;
          text-align: left;
          transition: all 0.18s ease;
          margin-top: 8px;
        }
        .rf-logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.25);
        }
        .sidebar-divider {
          height: 1px;
          background: rgba(167, 139, 250, 0.15);
          margin: 10px 0;
        }
        .sidebar-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(167, 139, 250, 0.45);
          padding: 6px 14px 4px;
        }
      `}</style>

      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🛒</span>
        <span className="sidebar-brand-text">RetailForecaster</span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="sidebar-section-label">Navigation</span>

        {navLinks.map(({ key, to, icon, label }) =>
          canView[key] ? (
            <NavLink key={key} to={to} className="rf-nav-item" onClick={nav}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ) : null
        )}

        <div className="sidebar-divider" style={{ marginTop: 12 }} />
        <button onClick={handleLogout} className="rf-logout-btn">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}

export default Sidebar;
