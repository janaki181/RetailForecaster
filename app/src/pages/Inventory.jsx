import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { api } from "../api/client";

// FIXED: all data live from backend — no hardcoded rows

const REORDER_STYLE = {
  Yes:  { background: "#fee2e2", color: "#b91c1c" },
  Soon: { background: "#fef9c3", color: "#854d0e" },
  No:   { background: "#f0fdf4", color: "#15803d" },
};

const ALERT_STYLE = {
  Stockout: { border: "1px solid #fca5a5", background: "#fff1f2" },
  Overstock: { border: "1px solid #c4b5fd", background: "#faf5ff" },
  Seasonal: { border: "1px solid #fde68a", background: "#fffbeb" },
};

function Inventory() {
  const [summary,  setSummary]  = useState(null);
  const [rows,     setRows]     = useState([]);
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/inventory/summary"),
      api.get("/api/inventory/stock-by-location"),
      api.get("/api/inventory/alerts"),
    ])
      .then(([s, r, a]) => { setSummary(s); setRows(r); setAlerts(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="dashboard page-shell">
      {/* ── Header ─────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <p className="topbar-subtitle">Stock coverage and reorder priorities</p>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────── */}
      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card">
          <h4>Total Units</h4>
          <strong>{loading ? "—" : summary?.total_units?.toLocaleString() ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Days of Cover</h4>
          <strong>{loading ? "—" : summary?.days_of_cover ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Reorder Required</h4>
          <strong className={summary?.reorder_required_skus > 0 ? "warning-text" : ""}>
            {loading ? "—" : `${summary?.reorder_required_skus ?? 0} SKUs`}
          </strong>
        </div>
        <div className="kpi-card">
          <h4>Warehouse Fill</h4>
          <strong>{loading ? "—" : `${summary?.warehouse_fill_pct ?? "—"}%`}</strong>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────── */}
      <div className="page-grid">
        {/* Stock by Location */}
        <div className="card">
          <h3>Stock by Location</h3>
          {loading ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading…</p>
          ) : (
            <table className="table-clean" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Location</th>
                  <th>On Hand</th>
                  <th>Days Left</th>
                  <th>Reorder</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, i) => {
                  const st = REORDER_STYLE[item.reorder_status] || {};
                  return (
                    <tr key={i} title={item.tooltip || ""}>
                      <td>{item.item}</td>
                      <td>{item.location}</td>
                      <td>{item.on_hand}</td>
                      <td style={{ color: item.days_of_stock_remaining < 15 ? "#dc2626" : "#475569" }}>
                        {item.days_of_stock_remaining != null
                          ? `${Math.round(item.days_of_stock_remaining)}d`
                          : "—"}
                      </td>
                      <td>
                        <span style={{
                          ...st, padding: "3px 10px",
                          borderRadius: 999, fontSize: 12, fontWeight: 700,
                        }}>
                          {item.reorder_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Inventory Alerts */}
        <div className="card">
          <h3>Inventory Alerts</h3>
          {loading && <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading…</p>}
          {!loading && alerts.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>✅ All stock levels healthy.</p>
          )}
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{
                ...(ALERT_STYLE[a.alert_type] || {}),
                borderRadius: 8, padding: "10px 12px", marginTop: 10,
              }}
            >
              <strong style={{ fontSize: 13 }}>{a.product}</strong>
              <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{a.message}</p>
              {a.predicted_stockout_date && (
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  Stockout: {a.predicted_stockout_date}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Inventory;
