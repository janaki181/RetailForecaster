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

const fmtSignedPct = (n) => {
  const num = Number(n ?? 0);
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};

const fmtOrderDate = (value) => {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Sales() {
  const [summary,  setSummary]  = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [channel,  setChannel]  = useState({ breakdown_pct: {}, insights: [] });
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [form, setForm] = useState({
    product_id: "",
    customer_name: "",
    channel: "In-Store",
    quantity: "1",
    status: "Delivered",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/sales/summary"),
      api.get("/api/sales/recent"),
      api.get("/api/sales/channel-mix"),
      api.get("/api/products"),
    ])
      .then(([s, o, c, p]) => {
        setSummary(s);
        setOrders(o);
        setChannel(c);
        setProducts(p || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleExport = () => downloadFile("/api/reports/export/csv", "sales_report.csv");

  const handleCreateSale = async (e) => {
    e.preventDefault();
    setFormErr("");
    setFormMsg("");
    setSaving(true);
    try {
      const res = await api.post("/api/sales", {
        product_id: Number(form.product_id),
        customer_name: form.customer_name.trim(),
        channel: form.channel,
        quantity: Number(form.quantity),
        status: form.status,
      });
      setFormMsg(`Sale recorded. Updated stock: ${res.stock_after}`);
      setForm({
        product_id: "",
        customer_name: "",
        channel: "In-Store",
        quantity: "1",
        status: "Delivered",
      });
      load();
    } catch (err) {
      setFormErr(err.message || "Failed to record sale.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (saleId, nextStatus) => {
    setStatusSavingId(saleId);
    try {
      await api.put(`/api/sales/${saleId}/status`, { status: nextStatus });
      load();
    } catch (_err) {
    } finally {
      setStatusSavingId(null);
    }
  };

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
        <button className="page-action" onClick={() => setShowForm(true)}>
          Record Sale
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────── */}
      <p className="section-label">Overview</p>
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
          <strong>{loading ? "—" : fmtSignedPct(summary?.conversion_rate)}</strong>
        </div>
      </div>

      {showForm && (
        <div className="page-form-overlay">
          <div className="page-form-modal">
            <div className="page-form-header">
              <h3>Record New Sale</h3>
              <button className="page-form-close" onClick={() => setShowForm(false)}>Close</button>
            </div>

            <form className="page-form-body" onSubmit={handleCreateSale}>
              <label className="page-form-field">
                <span>Product *</span>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                  required
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                  ))}
                </select>
              </label>

              <label className="page-form-field">
                <span>Customer Name *</span>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  required
                />
              </label>

              <label className="page-form-field">
                <span>Channel *</span>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  <option>Online</option>
                  <option>In-Store</option>
                  <option>Marketplace</option>
                </select>
              </label>

              <label className="page-form-field">
                <span>Quantity *</span>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </label>

              <label className="page-form-field">
                <span>Status *</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  <option>Delivered</option>
                  <option>Shipped</option>
                  <option>Packed</option>
                  <option>Processing</option>
                </select>
              </label>

              {formErr && <p style={{ color: "#ef4444", fontSize: 13 }}>{formErr}</p>}
              {formMsg && <p style={{ color: "#15803d", fontSize: 13 }}>{formMsg}</p>}

              <div className="page-form-actions">
                <button type="button" className="page-form-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="page-form-submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main Grid ──────────────────────────── */}
      <p className="section-label">Sales Activity</p>
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
                  <th>Sold On</th>
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
                      <td>{fmtOrderDate(o.sale_date)}</td>
                      <td>{o.customer_name}</td>
                      <td style={{ color: "#475569", fontSize: 12 }}>{o.product}</td>
                      <td>{o.channel}</td>
                      <td>{fmtRs(o.value)}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusUpdate(o.sale_id, e.target.value)}
                          disabled={statusSavingId === o.sale_id}
                          style={{
                            ...st,
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "none",
                            outline: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option>Processing</option>
                          <option>Packed</option>
                          <option>Shipped</option>
                          <option>Delivered</option>
                        </select>
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
