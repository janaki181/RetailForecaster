import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { api, downloadFile } from "../api/client";

// FIXED: Export button triggers real CSV download, not a useless modal
// FIXED: all data live from backend

const STATUS_STYLE = {
  Delivered:  { background: "#dcfce7", color: "#15803d" },
  Shipped:    { background: "#dbeafe", color: "#1d4ed8" },
  Packed:     { background: "#fef9c3", color: "#854d0e" },
  Processing: { background: "#f3f4f6", color: "#475569" },
};

const fmtRs = (n) =>
  "Rs " + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function Sales() {
  const [summary,  setSummary]  = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [channel,  setChannel]  = useState({ breakdown_pct: {}, insights: [] });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/sales/summary"),
      api.get("/api/sales/recent"),
      api.get("/api/sales/channel-mix"),
    ])
      .then(([s, o, c]) => {
        setSummary(s);
        setOrders(o);
        setChannel(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => downloadFile("/api/reports/export/csv", "sales_report.csv");

  return (
    <div className="dashboard page-shell">
      {/* ── Header ─────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Sales</h2>
          <p className="topbar-subtitle">Daily orders, channels, and conversion outcomes</p>
        </div>
        <button className="page-action" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────── */}
      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card">
          <h4>Today Revenue</h4>
          <strong>{loading ? "—" : fmtRs(summary?.today_revenue ?? 0)}</strong>
        </div>
        <div className="kpi-card">
          <h4>Orders</h4>
          <strong>{loading ? "—" : summary?.orders_today ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Avg. Order Value</h4>
          <strong>{loading ? "—" : fmtRs(summary?.avg_order_value ?? 0)}</strong>
        </div>
        <div className="kpi-card">
          <h4>Conversion Rate</h4>
          <strong>{loading ? "—" : `${summary?.conversion_rate ?? "—"}%`}</strong>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────── */}
      <div className="page-grid">
        {/* Recent Orders */}
        <div className="card">
          <h3>Recent Orders</h3>
          {loading ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading…</p>
          ) : orders.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>No orders yet.</p>
          ) : (
            <table className="table-clean" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Channel</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = STATUS_STYLE[o.status] || {};
                  return (
                    <tr key={o.order_id}>
                      <td>{o.order_id}</td>
                      <td>{o.customer_name}</td>
                      <td style={{ color: "#475569", fontSize: 12 }}>{o.product}</td>
                      <td>{o.channel}</td>
                      <td>{fmtRs(o.value)}</td>
                      <td>
                        <span
                          style={{
                            ...st,
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Channel Mix */}
        <div className="card">
          <h3>Channel Mix</h3>
          {Object.keys(channel.breakdown_pct).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {Object.entries(channel.breakdown_pct).map(([ch, pct]) => (
                <div key={ch} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{ch}</span>
                    <strong>{pct}%</strong>
                  </div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "#3b82f6",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {channel.insights.length > 0 && (
            <ul className="insight-list">
              {channel.insights.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          )}
          {channel.insights.length === 0 && !loading && (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
              No channel insights yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sales;
