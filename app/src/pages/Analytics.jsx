import { useEffect, useRef, useState } from "react";
import "../styles/dashboard.css";
import Chart from "chart.js/auto";
import { api } from "../api/client";

// FIXED: all data live from backend — no hardcoded stats or highlights
// Added: 7-day ML forecast chart, demand summary table, seasonal forecast panel

const ACTION_STYLE = {
  "Urgent Restock": { background: "#fee2e2", color: "#b91c1c" },
  Restock:          { background: "#fef9c3", color: "#854d0e" },
  Monitor:          { background: "#f0fdf4", color: "#15803d" },
  "Overstock Risk": { background: "#ede9fe", color: "#6d28d9" },
  Markdown:         { background: "#f1f5f9", color: "#475569" },
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ef4444"];

function ForecastChart() {
  const canvasRef     = useRef();
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [selectedProduct, setSelectedProduct] = useState("ALL");
  const [showActual, setShowActual] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);

  useEffect(() => {
    api.get("/api/forecast/chart-data")
      .then((data) => {
        setChartData(data || { labels: [], datasets: [] });
        const first = data?.datasets?.[0]?.product;
        if (first) {
          setSelectedProduct(first);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!chartData.labels?.length) {
      return;
    }

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const shortLabels = chartData.labels.map((l) => {
      const d = new Date(l);
      return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
    });

    const source = selectedProduct === "ALL"
      ? chartData.datasets
      : chartData.datasets.filter((d) => d.product === selectedProduct);

    const datasets = [];
    source.forEach((ds, i) => {
      const color = CHART_COLORS[i % CHART_COLORS.length];
      if (showActual) {
        datasets.push({
          label: `${ds.product} (Actual)`,
          data: ds.actual_values,
          borderColor: color,
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 1.5,
        });
      }
      if (showPredicted) {
        datasets.push({
          label: `${ds.product} (Predicted)`,
          data: ds.predicted_values,
          borderColor: color,
          borderDash: [6, 4],
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius: 1.2,
        });
      }
    });

    chartInstance.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: shortLabels,
        datasets,
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "top", labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw || 0).toFixed(2)} units`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Units" },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [chartData, selectedProduct, showActual, showPredicted]);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h3>
        Top-5 Demand Trend (Last 30 Days){" "}
        {loading && <span style={{ fontSize: 12, color: "#9ca3af" }}>loading…</span>}
      </h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "10px 0 14px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          Product:
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
          >
            {chartData.datasets.length > 1 && <option value="ALL">All Top 5</option>}
            {chartData.datasets.map((d) => (
              <option key={d.product} value={d.product}>{d.product}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={showActual} onChange={(e) => setShowActual(e.target.checked)} />
          Actual
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={showPredicted} onChange={(e) => setShowPredicted(e.target.checked)} />
          Predicted
        </label>
      </div>

      <canvas ref={canvasRef} />
    </div>
  );
}

function Analytics() {
  const [summary,    setSummary]    = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [actions,    setActions]    = useState([]);
  const [demand,     setDemand]     = useState([]);
  const [seasonal,   setSeasonal]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/analytics/summary"),
      api.get("/api/analytics/performance-highlights"),
      api.get("/api/analytics/recommended-actions"),
      api.get("/api/forecast/demand-summary"),
      api.get("/api/analytics/seasonal-forecast"),
    ])
      .then(([s, h, a, d, sf]) => {
        setSummary(s);
        setHighlights(h.highlights || []);
        setActions(a.actions || []);
        setDemand(d.slice(0, 8));
        setSeasonal(sf);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard page-shell">
      {/* ── Header ─────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="topbar-subtitle">Traffic, behaviour, and forecast confidence trends</p>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────── */}
      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card">
          <h4>Sessions (7D)</h4>
          <strong>{loading ? "—" : summary?.sessions_7d?.toLocaleString() ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Bounce Rate</h4>
          <strong>{loading ? "—" : `${summary?.bounce_rate_pct ?? "—"}%`}</strong>
        </div>
        <div className="kpi-card">
          <h4>Forecast Confidence</h4>
          <strong style={{ color: "#16a34a" }}>
            {loading
              ? "—"
              : summary?.forecast_confidence_pct != null
              ? `${summary.forecast_confidence_pct.toFixed(1)}%`
              : "—"}
          </strong>
        </div>
        <div className="kpi-card">
          <h4>Returning Users</h4>
          <strong>{loading ? "—" : `${summary?.returning_users_pct ?? "—"}%`}</strong>
        </div>
      </div>

      {/* ── Highlights + Actions ───────────────── */}
      <div className="page-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Performance Highlights</h3>
          {highlights.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
              {loading ? "Loading…" : "No highlights yet."}
            </p>
          ) : (
            <ul className="insight-list">
              {highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Recommended Actions</h3>
          {actions.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
              {loading ? "Loading…" : "No actions yet."}
            </p>
          ) : (
            <ul className="insight-list">
              {actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* ── 7-Day ML Forecast Chart ───────────── */}
      <ForecastChart />

      {/* ── Demand Summary Table ──────────────── */}
      {demand.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>Demand Summary — Next 30 Days</h3>
          <table className="table-clean" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>30D Forecast</th>
                <th>Trend</th>
                <th>Action</th>
                <th>Season Note</th>
              </tr>
            </thead>
            <tbody>
              {demand.map((d, i) => {
                const st = ACTION_STYLE[d.action] || {};
                return (
                  <tr key={i}>
                    <td>{d.product}</td>
                    <td>{d.current_stock}</td>
                    <td>{d.forecast_30d}</td>
                    <td
                      style={{
                        color: d.trend_pct == null ? "#6b7280" : d.trend_pct >= 0 ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      {d.trend_pct != null
                        ? (d.trend_pct >= 0 ? "+" : "") + d.trend_pct.toFixed(1) + "%"
                        : "—"}
                    </td>
                    <td>
                      <span style={{ ...st, padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {d.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#f59e0b" }}>
                      {d.season_note || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Seasonal Forecast Panel ───────────── */}
      {seasonal.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Upcoming Season Forecast</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {seasonal.map((s, i) => (
              <div
                key={i}
                className="card"
                style={{ borderLeft: "4px solid #f59e0b", padding: "16px 20px" }}
              >
                <strong style={{ fontSize: 15 }}>🗓 {s.season}</strong>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>
                  Starts in <strong>{s.starts_in_days}</strong> days
                </p>
                <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>
                  +{s.expected_demand_spike_pct}% demand spike
                </p>
                <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  Stock up: {s.products_to_stock.join(", ")}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  Reorder by: {s.reorder_deadline}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
