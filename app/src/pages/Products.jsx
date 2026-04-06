import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { api } from "../api/client";

// FIXED: all data live from backend — no hardcoded rows
// FIXED: Add Product form fields match POST /api/products schema exactly

const CATEGORIES  = ["Clothing", "Footwear", "Accessories", "Kids", "Home", "Beauty"];
const GENDERS     = ["Men", "Women", "Kids", "Unisex"];
const SIZES       = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const SEASON_TAGS = ["all-season", "summer", "winter", "monsoon", "festive"];

const TREND_COLOR = (pct) => {
  if (pct == null) return "#6b7280";
  return pct >= 0 ? "#16a34a" : "#dc2626";
};

const ACTION_STYLE = {
  "Urgent Restock": { background: "#fee2e2", color: "#b91c1c" },
  Restock:          { background: "#fef9c3", color: "#854d0e" },
  Monitor:          { background: "#f0fdf4", color: "#15803d" },
  "Overstock Risk": { background: "#ede9fe", color: "#6d28d9" },
  Markdown:         { background: "#f1f5f9", color: "#475569" },
};

function Products() {
  const [summary,  setSummary]  = useState(null);
  const [products, setProducts] = useState([]);
  const [notes,    setNotes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");

  const [form, setForm] = useState({
    name: "", category: "Clothing", gender: "Unisex", size: "M",
    color: "", price: "", cost_price: "", stock: "", min_stock: "",
    location: "", season_tag: "all-season",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/products/summary"),
      api.get("/api/products/top-performing"),
      api.get("/api/products/notes"),
    ])
      .then(([s, p, n]) => {
        setSummary(s);
        setProducts(p);
        setNotes(n.notes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr("");
    setSaving(true);
    try {
      await api.post("/api/products", {
        ...form,
        price:      parseFloat(form.price),
        cost_price: parseFloat(form.cost_price),
        stock:      parseInt(form.stock),
        min_stock:  parseInt(form.min_stock),
      });
      setShowForm(false);
      setForm({
        name: "", category: "Clothing", gender: "Unisex", size: "M",
        color: "", price: "", cost_price: "", stock: "", min_stock: "",
        location: "", season_tag: "all-season",
      });
      load();
    } catch (err) {
      setFormErr(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard page-shell">
      {/* ── Header ─────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="topbar-subtitle">Catalog performance and stock health</p>
        </div>
        <button className="page-action" onClick={() => setShowForm(true)}>
          Add Product
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────── */}
      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card">
          <h4>Active SKUs</h4>
          <strong>{loading ? "—" : summary?.active_skus ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Top Category</h4>
          <strong>{loading ? "—" : summary?.top_category ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Low Stock Items</h4>
          <strong className={summary?.low_stock_items > 0 ? "warning-text" : ""}>
            {loading ? "—" : summary?.low_stock_items ?? "—"}
          </strong>
        </div>
        <div className="kpi-card">
          <h4>Avg. Margin</h4>
          <strong>{loading ? "—" : `${summary?.avg_margin_pct ?? "—"}%`}</strong>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────── */}
      <div className="page-grid">
        {/* Best Performing Products */}
        <div className="card">
          <h3>Best Performing Products</h3>
          {loading ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading…</p>
          ) : (
            <table className="table-clean" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>7D Trend</th>
                  <th>Next 7D</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const action = p.season_alert
                    ? "Restock"
                    : p.stock < 20
                    ? "Urgent Restock"
                    : p.forecast_next_7d > p.stock
                    ? "Restock"
                    : "Monitor";
                  const st = ACTION_STYLE[action] || {};
                  return (
                    <tr key={p.sku}>
                      <td>{p.sku}</td>
                      <td>
                        {p.name}
                        {p.season_alert && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#f59e0b" }}>
                            🎉 {p.season_alert}
                          </span>
                        )}
                      </td>
                      <td>{p.category}</td>
                      <td>{p.stock}</td>
                      <td style={{ color: TREND_COLOR(p.trend_7d_pct), fontWeight: 600 }}>
                        {p.trend_7d_pct != null
                          ? (p.trend_7d_pct >= 0 ? "+" : "") + p.trend_7d_pct.toFixed(1) + "%"
                          : "—"}
                      </td>
                      <td>{p.forecast_next_7d > 0 ? `${Math.round(p.forecast_next_7d)} units` : "—"}</td>
                      <td>
                        <span
                          style={{
                            ...st,
                            padding: "3px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Product Notes (LLM) */}
        <div className="card">
          <h3>Product Notes</h3>
          {notes.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
              {loading ? "Loading…" : "No notes available."}
            </p>
          ) : (
            <ul className="insight-list">
              {notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* ── Add Product Modal ──────────────────── */}
      {showForm && (
        <div className="page-form-overlay">
          <div className="page-form-modal" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="page-form-header">
              <h3>Add Product</h3>
              <button className="page-form-close" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <p className="page-form-description">
              Fill in all product details. SKU is auto-generated.
            </p>

            <form className="page-form-body" onSubmit={handleSubmit}>
              {[
                { name: "name",       label: "Product Name",  required: true },
                { name: "color",      label: "Color" },
                { name: "price",      label: "Price (₹)",     type: "number", required: true },
                { name: "cost_price", label: "Cost Price (₹)", type: "number", required: true },
                { name: "stock",      label: "Initial Stock",  type: "number", required: true },
                { name: "min_stock",  label: "Min Stock Level", type: "number", required: true },
                { name: "location",   label: "Location / Shelf" },
              ].map((f) => (
                <label key={f.name} className="page-form-field">
                  <span>{f.label}{f.required && " *"}</span>
                  <input
                    type={f.type || "text"}
                    name={f.name}
                    value={form[f.name]}
                    required={f.required}
                    onChange={handleChange}
                  />
                </label>
              ))}

              {[
                { name: "category",   label: "Category",   opts: CATEGORIES },
                { name: "gender",     label: "Gender",     opts: GENDERS },
                { name: "size",       label: "Size",       opts: SIZES },
                { name: "season_tag", label: "Season Tag", opts: SEASON_TAGS },
              ].map((f) => (
                <label key={f.name} className="page-form-field">
                  <span>{f.label}</span>
                  <select name={f.name} value={form[f.name]} onChange={handleChange}
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}>
                    {f.opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              ))}

              {formErr && (
                <p style={{ color: "#ef4444", fontSize: 13 }}>{formErr}</p>
              )}

              <div className="page-form-actions">
                <button type="button" className="page-form-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="page-form-submit" disabled={saving}>
                  {saving ? "Saving…" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
