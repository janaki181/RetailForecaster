import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { api } from "../api/client";

// FIXED: all data live from backend — no hardcoded rows
// FIXED: Create PO modal loads ML reorder recommendations and submits to real endpoint

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

  // PO modal state
  const [showPO,   setShowPO]   = useState(false);
  const [recs,     setRecs]     = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [poQty,    setPoQty]    = useState("");
  const [poSaving, setPoSaving] = useState(false);
  const [poMsg,    setPoMsg]    = useState("");

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

  const openPO = () => {
    setShowPO(true);
    setPoMsg("");
    setSelectedRec(null);
    setPoQty("");
    setRecsLoading(true);
    api.get("/api/forecast/reorder-recommendations")
      .then((data) => setRecs(data.filter((r) => r.reorder_qty_recommended > 0)))
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false));
  };

  const selectRec = (rec) => {
    setSelectedRec(rec);
    setPoQty(String(rec.reorder_qty_recommended));
    setPoMsg("");
  };

  const submitPO = async () => {
    if (!selectedRec) return;
    setPoSaving(true);
    setPoMsg("");
    try {
      const res = await api.post("/api/inventory/create-po", {
        product_id: selectedRec.product_id,
        quantity:   parseInt(poQty),
      });
      setPoMsg(`✅ PO #${res.po_id} created for ${res.product} — ${res.quantity} units.`);
      setSelectedRec(null);
      setPoQty("");
      load();
    } catch (err) {
      setPoMsg(`❌ ${err.message}`);
    } finally {
      setPoSaving(false);
    }
  };

  return (
    <div className="dashboard page-shell">
      {/* ── Header ─────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <p className="topbar-subtitle">Stock coverage and reorder priorities</p>
        </div>
        <button className="page-action" onClick={openPO}>Create PO</button>
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

      {/* ── Create PO Modal ────────────────────── */}
      {showPO && (
        <div className="page-form-overlay">
          <div className="page-form-modal" style={{ maxHeight: "85vh", overflowY: "auto", width: "min(680px,95%)" }}>
            <div className="page-form-header">
              <h3>Create Purchase Order</h3>
              <button className="page-form-close" onClick={() => setShowPO(false)}>Close</button>
            </div>
            <p className="page-form-description">
              ML-recommended reorder quantities based on 7-day demand forecast.
              Select a product, adjust quantity if needed, then confirm.
            </p>

            {recsLoading && (
              <p style={{ color: "#9ca3af", fontSize: 13, padding: "12px 0" }}>
                Loading ML recommendations…
              </p>
            )}

            {!recsLoading && recs.length === 0 && (
              <p style={{ color: "#6b7280", fontSize: 13, padding: "12px 0" }}>
                ✅ No reorder needed right now.
              </p>
            )}

            {!recsLoading && recs.length > 0 && (
              <table className="table-clean" style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>30D Forecast</th>
                    <th>Rec. Qty</th>
                    <th>Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map((r) => {
                    const selected = selectedRec?.product_id === r.product_id;
                    return (
                      <tr
                        key={r.product_id}
                        onClick={() => selectRec(r)}
                        style={{
                          cursor: "pointer",
                          background: selected ? "#eff6ff" : "transparent",
                          outline: selected ? "2px solid #3b82f6" : "none",
                        }}
                      >
                        <td>
                          <input type="radio" readOnly checked={selected} />
                        </td>
                        <td>
                          {r.name}
                          {r.season_note && (
                            <div style={{ fontSize: 11, color: "#f59e0b" }}>{r.season_note}</div>
                          )}
                        </td>
                        <td>{r.current_stock}</td>
                        <td>{Math.round(r.predicted_demand_30d)}</td>
                        <td style={{ fontWeight: 700, color: "#1d4ed8" }}>{r.reorder_qty_recommended}</td>
                        <td>
                          <span style={{
                            background: r.urgency === "Critical" ? "#fee2e2" : r.urgency === "High" ? "#ffedd5" : "#fef9c3",
                            color: r.urgency === "Critical" ? "#b91c1c" : r.urgency === "High" ? "#c2410c" : "#854d0e",
                            padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                          }}>
                            {r.urgency}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {selectedRec && (
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <strong style={{ fontSize: 13 }}>Confirm PO: {selectedRec.name}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <label style={{ fontSize: 13 }}>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={poQty}
                    onChange={(e) => setPoQty(e.target.value)}
                    style={{
                      width: 100, padding: "6px 10px",
                      border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    (Recommended: {selectedRec.reorder_qty_recommended})
                  </span>
                </div>
                {selectedRec.days_of_stock_remaining && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                    ⚠ Stockout predicted in {Math.round(selectedRec.days_of_stock_remaining)} days
                  </p>
                )}
              </div>
            )}

            {poMsg && (
              <p style={{
                fontSize: 13, fontWeight: 600,
                color: poMsg.startsWith("✅") ? "#15803d" : "#b91c1c",
                marginBottom: 10,
              }}>
                {poMsg}
              </p>
            )}

            <div className="page-form-actions">
              <button className="page-form-cancel" onClick={() => setShowPO(false)}>Close</button>
              {selectedRec && (
                <button
                  className="page-form-submit"
                  onClick={submitPO}
                  disabled={poSaving || !poQty || parseInt(poQty) <= 0}
                >
                  {poSaving ? "Creating…" : "Confirm PO"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
