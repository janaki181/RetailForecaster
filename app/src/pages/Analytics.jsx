import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { api } from "../api/client";

/* ─── Constants ─────────────────────────────────────────── */
const ACTION_META = {
  "Urgent Restock": { bg: "rgba(239,68,68,0.1)",    color: "#f87171", dot: "#ef4444" },
  Restock:          { bg: "rgba(251,146,60,0.1)",    color: "#fb923c", dot: "#f97316" },
  Monitor:          { bg: "rgba(52,211,153,0.1)",    color: "#34d399", dot: "#10b981" },
  "Overstock Risk": { bg: "rgba(167,139,250,0.15)",  color: "#a78bfa", dot: "#8b5cf6" },
  Markdown:         { bg: "rgba(148,163,184,0.12)",  color: "#94a3b8", dot: "#64748b" },
};

const CHART_COLORS = ["#818cf8", "#c084fc", "#f472b6", "#34d399", "#fb923c"];
const SPARKLINE_DATA = [28, 42, 35, 58, 47, 63, 71];

/* ─── Mini Sparkline ────────────────────────────────────── */
function Sparkline({ data, color }) {
  const w = 72, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  const fill = pts + ` ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Forecast Chart ────────────────────────────────────── */
function ForecastChart() {
  const canvasRef     = useRef();
  const chartInstance = useRef(null);
  const [loading, setLoading]                 = useState(true);
  const [chartData, setChartData]             = useState({ labels: [], datasets: [] });
  const [selectedProduct, setSelectedProduct] = useState("ALL");
  const [showActual, setShowActual]           = useState(true);
  const [showPredicted, setShowPredicted]     = useState(true);

  useEffect(() => {
    api.get("/api/forecast/chart-data")
      .then((data) => {
        setChartData(data || { labels: [], datasets: [] });
        const first = data?.datasets?.[0]?.product;
        if (first) setSelectedProduct(first);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!chartData.labels?.length) return;
    if (chartInstance.current) chartInstance.current.destroy();

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
      if (showActual) datasets.push({
        label: `${ds.product} · Actual`,
        data: ds.actual_values,
        borderColor: color,
        backgroundColor: color + "14",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: false,
      });
      if (showPredicted) datasets.push({
        label: `${ds.product} · Predicted`,
        data: ds.predicted_values,
        borderColor: color,
        borderDash: [5, 4],
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
      });
    });

    chartInstance.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: shortLabels, datasets },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top", align: "end",
            labels: {
              font: { size: 11, family: "inherit" },
              color: "#475569",
              boxWidth: 24, boxHeight: 2, padding: 16,
              usePointStyle: false,
            },
          },
          tooltip: {
            backgroundColor: "rgba(17,10,44,0.93)",
            titleColor: "#e9d5ff",
            bodyColor: "rgba(196,181,253,0.85)",
            borderColor: "rgba(139,92,246,0.4)",
            borderWidth: 1, padding: 12,
            callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${Number(ctx.raw || 0).toFixed(1)} units` },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(139,92,246,0.07)" },
            ticks: { color: "#64748b", font: { size: 10 }, maxTicksLimit: 8 },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(139,92,246,0.07)" },
            ticks: { color: "#64748b", font: { size: 10 } },
            border: { display: false },
          },
        },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [chartData, selectedProduct, showActual, showPredicted]);

  const CheckBox = ({ checked, onChange, label }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: checked ? "#1e293b" : "#64748b", fontWeight: 600, cursor: "pointer", userSelect: "none" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 16, height: 16, borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
          background: checked ? "linear-gradient(135deg,#818cf8,#a78bfa)" : "rgba(139,92,246,0.08)",
          border: `1px solid ${checked ? "transparent" : "rgba(139,92,246,0.22)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {checked && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {label}
    </label>
  );

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Product</span>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{
              padding: "5px 28px 5px 10px", borderRadius: 8,
              border: "1px solid rgba(139,92,246,0.25)",
              background: "rgba(255,255,255,0.7)",
              color: "#0f172a", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238b5cf6' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            }}
          >
            {chartData.datasets.length > 1 && <option value="ALL">All Top 5</option>}
            {chartData.datasets.map((d) => <option key={d.product} value={d.product}>{d.product}</option>)}
          </select>
        </div>
        <CheckBox checked={showActual} onChange={setShowActual} label="Actual" />
        <CheckBox checked={showPredicted} onChange={setShowPredicted} label="Predicted" />
        {loading && <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>Loading...</span>}
      </div>
      <canvas ref={canvasRef} style={{ maxHeight: 270 }} />
    </div>
  );
}

/* ─── Main Analytics Page ───────────────────────────────── */
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

  const kpis = [
    { label: "Sessions", period: "7-day window", value: loading ? "—" : summary?.sessions_7d?.toLocaleString() ?? "—", color: "#818cf8", trend: "+12%", up: true, invertGood: false },
    { label: "Bounce Rate", period: "current rate", value: loading ? "—" : `${summary?.bounce_rate_pct ?? "—"}%`, color: "#f472b6", trend: "-4%", up: false, invertGood: true },
    { label: "Forecast Confidence", period: "ML model", value: loading ? "—" : summary?.forecast_confidence_pct != null ? `${summary.forecast_confidence_pct.toFixed(1)}%` : "—", color: "#34d399", trend: "+2.1%", up: true, invertGood: false },
    { label: "Returning Users", period: "30-day avg", value: loading ? "—" : `${summary?.returning_users_pct ?? "—"}%`, color: "#c084fc", trend: "+8%", up: true, invertGood: false },
  ];

  return (
    <>
      <style>{`
        .an-page {
          min-height: 100vh;
          background: transparent;
          padding: 32px 32px 64px;
          box-sizing: border-box;
        }
        .an-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .an-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px;
          letter-spacing: -0.6px;
        }
        .an-subtitle {
          font-size: 13px;
          color: #475569;
          margin: 0;
          font-weight: 500;
        }
        .an-date-chip {
          font-size: 12px;
          color: #334155;
          background: #e2e8f0;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 5px 14px;
          font-weight: 600;
        }
        /* Section divider label */
        .an-sec {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .an-sec::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(139,92,246,0.13);
        }
        /* KPI grid */
        .an-kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 26px;
        }
        @media (max-width: 900px) { .an-kpi-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .an-kpi-row { grid-template-columns: 1fr; } }
        .an-kpi {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 18px 18px 14px;
          position: relative;
          overflow: hidden;
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: default;
        }
        .an-kpi:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
        }
        .an-kpi-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 18px 18px 0 0;
        }
        .an-kpi-meta {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .an-kpi-label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #64748b; }
        .an-kpi-period { font-size: 10px; color: #64748b; margin-top: 3px; font-weight: 500; }
        .an-kpi-bottom { display: flex; align-items: flex-end; justify-content: space-between; }
        .an-kpi-value { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -1px; line-height: 1; }
        .an-trend-badge {
          font-size: 11.5px; font-weight: 700;
          padding: 3px 8px; border-radius: 999px;
          display: flex; align-items: center; gap: 2px;
        }
        .an-trend-badge.good { background: rgba(52,211,153,0.12); color: #059669; }
        .an-trend-badge.bad  { background: rgba(248,113,113,0.12); color: #dc2626; }
        /* Cards */
        .an-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(167,139,250,0.16);
          border-radius: 18px;
          padding: 22px 24px;
        }
        .an-card-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .an-badge {
          font-size: 10px;
          font-weight: 700;
          background: rgba(139,92,246,0.1);
          color: #7c3aed;
          border: 1px solid rgba(139,92,246,0.18);
          border-radius: 999px;
          padding: 2px 8px;
        }
        /* Intelligence row */
        .an-intel-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 680px) { .an-intel-row { grid-template-columns: 1fr; } }
        /* Insight list */
        .an-ilist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
        .an-ilist li {
          display: flex; gap: 10px; align-items: flex-start;
          font-size: 13px; color: #1e293b; line-height: 1.5;
          padding: 9px 12px;
          background: rgba(109,40,217,0.04);
          border-radius: 10px;
          border: 1px solid rgba(139,92,246,0.09);
        }
        .an-idot { width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .an-empty { font-size: 13px; color: #64748b; text-align: center; padding: 28px 0; font-style: italic; margin: 0; }
        /* Chart section */
        .an-chart-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(167,139,250,0.16);
          border-radius: 18px;
          padding: 22px 24px;
          margin-bottom: 20px;
        }
        .an-chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2px; }
        /* Table */
        .an-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .an-table thead th {
          text-align: left; padding: 7px 14px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
          color: #64748b;
          border-bottom: 1px solid rgba(139,92,246,0.1);
          white-space: nowrap;
        }
        .an-table tbody td {
          padding: 10px 14px; color: #1e293b;
          border-bottom: 1px solid rgba(139,92,246,0.07);
          vertical-align: middle;
        }
        .an-table tbody tr:last-child td { border-bottom: none; }
        .an-table tbody tr { transition: background 0.1s; }
        .an-table tbody tr:hover td { background: rgba(139,92,246,0.04); }
        .an-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .an-pill-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
        .an-tup   { color: #059669; font-weight: 700; }
        .an-tdown { color: #dc2626; font-weight: 700; }
        .an-tnil  { color: #94a3b8; }
        .an-snote { font-size: 11.5px; color: #d97706; font-weight: 600; }
        /* Seasonal grid */
        .an-seasonal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 14px;
        }
        .an-seasonal-card {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(167,139,250,0.18);
          border-top: 3px solid #a78bfa;
          border-radius: 14px;
          padding: 18px;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .an-seasonal-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(109,40,217,0.1); }
        .an-season-name { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
        .an-season-spike {
          font-size: 26px; font-weight: 800;
          background: linear-gradient(135deg,#818cf8,#a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          line-height: 1; margin-bottom: 2px;
        }
        .an-season-sub { font-size: 10.5px; color: #64748b; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .an-season-meta { font-size: 12px; color: #334155; margin: 3px 0; }
        .an-season-div { height: 1px; background: rgba(139,92,246,0.1); margin: 10px 0; }
        .an-season-products { font-size: 11.5px; color: #1e293b; }
        .an-season-deadline { font-size: 10.5px; color: #64748b; margin-top: 4px; }
      `}</style>

      <div className="an-page">

        {/* ── Header ── */}
        <div className="an-header">
          <div>
            <h2 className="an-title">Analytics</h2>
            <p className="an-subtitle">Traffic, behaviour &amp; ML forecast confidence</p>
          </div>
          <span className="an-date-chip">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* ── Overview KPIs ── */}
        <p className="an-sec">Overview</p>
        <div className="an-kpi-row">
          {kpis.map((k) => {
            const isGood = k.invertGood ? !k.up : k.up;
            return (
              <div key={k.label} className="an-kpi">
                <div className="an-kpi-accent" style={{ background: `linear-gradient(90deg,${k.color}cc,${k.color}44)` }} />
                <div className="an-kpi-meta">
                  <div>
                    <div className="an-kpi-label">{k.label}</div>
                    <div className="an-kpi-period">{k.period}</div>
                  </div>
                  <Sparkline data={SPARKLINE_DATA} color={k.color} />
                </div>
                <div className="an-kpi-bottom">
                  <div className="an-kpi-value">{k.value}</div>
                  <span className={`an-trend-badge ${isGood ? "good" : "bad"}`}>
                    {k.up ? "↑" : "↓"} {k.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Intelligence ── */}
        <p className="an-sec">Intelligence</p>
        <div className="an-intel-row">
          <div className="an-card">
            <h3 className="an-card-title">
              Performance Highlights
              {highlights.length > 0 && <span className="an-badge">{highlights.length}</span>}
            </h3>
            {highlights.length === 0
              ? <p className="an-empty">{loading ? "Fetching…" : "No highlights yet."}</p>
              : <ul className="an-ilist">
                  {highlights.map((h, i) => (
                    <li key={i}>
                      <span className="an-idot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {h}
                    </li>
                  ))}
                </ul>
            }
          </div>

          <div className="an-card">
            <h3 className="an-card-title">
              Recommended Actions
              {actions.length > 0 && (
                <span className="an-badge" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", borderColor: "rgba(239,68,68,0.18)" }}>
                  {actions.length}
                </span>
              )}
            </h3>
            {actions.length === 0
              ? <p className="an-empty">{loading ? "Fetching…" : "No actions yet."}</p>
              : <ul className="an-ilist">
                  {actions.map((a, i) => (
                    <li key={i}>
                      <span className="an-idot" style={{ background: "#f87171" }} />
                      {a}
                    </li>
                  ))}
                </ul>
            }
          </div>
        </div>

        {/* ── Forecast Chart ── */}
        <p className="an-sec">Demand Forecast</p>
        <div className="an-chart-card">
          <div className="an-chart-header">
            <div>
              <h3 className="an-card-title" style={{ margin: "0 0 2px" }}>
                Top-5 Product Demand Trend
                <span className="an-badge">Last 30 Days</span>
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 18px", fontWeight: 500 }}>
                Actual vs. ML-predicted daily units sold
              </p>
            </div>
          </div>
          <ForecastChart />
        </div>

        {/* ── Inventory Action Plan ── */}
        {demand.length > 0 && (
          <>
            <p className="an-sec">Inventory Action Plan</p>
            <div className="an-card" style={{ marginBottom: 20 }}>
              <h3 className="an-card-title">
                Demand Summary
                <span className="an-badge">Next 30 Days</span>
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table className="an-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>30D Forecast</th>
                      <th>Trend</th>
                      <th>Action</th>
                      <th>Season Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demand.map((d, i) => {
                      const meta = ACTION_META[d.action] || { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", dot: "#64748b" };
                      const trendClass = d.trend_pct == null ? "an-tnil" : d.trend_pct >= 0 ? "an-tup" : "an-tdown";
                      const trendText = d.trend_pct != null
                        ? (d.trend_pct >= 0 ? "↑ +" : "↓ ") + d.trend_pct.toFixed(1) + "%"
                        : "—";
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>{d.product}</td>
                          <td style={{ color: "#475569" }}>{d.current_stock ?? "—"}</td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{d.forecast_30d ?? "—"}</td>
                          <td className={trendClass} style={{ fontWeight: 700 }}>{trendText}</td>
                          <td>
                            <span className="an-pill" style={{ background: meta.bg, color: meta.color }}>
                              <span className="an-pill-dot" style={{ background: meta.dot }} />
                              {d.action}
                            </span>
                          </td>
                          <td className="an-snote">{d.season_note || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Seasonal Outlook ── */}
        {seasonal.length > 0 && (
          <>
            <p className="an-sec">Seasonal Outlook</p>
            <div className="an-seasonal-grid">
              {seasonal.map((s, i) => (
                <div key={i} className="an-seasonal-card">
                  <p className="an-season-name">🗓 {s.season}</p>
                  <div className="an-season-spike">+{s.expected_demand_spike_pct}%</div>
                  <div className="an-season-sub">expected demand spike</div>
                  <p className="an-season-meta">Starts in <strong>{s.starts_in_days}</strong> days</p>
                  <div className="an-season-div" />
                  <p className="an-season-products"><strong>Stock up:</strong> {s.products_to_stock.join(", ")}</p>
                  <p className="an-season-deadline">Reorder by {s.reorder_deadline}</p>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </>
  );
}

export default Analytics;
