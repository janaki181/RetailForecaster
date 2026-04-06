import { useEffect, useState } from "react";
import { api } from "../../api/client";

const fmtRs = (n) =>
  n == null ? "—" : "Rs " + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtPct = (n) =>
  n == null ? null : (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

function KPIGrid() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/summary")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="kpi-card" key={i} style={{ opacity: 0.45 }}>
            <p>Loading…</p><h2>—</h2>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title:    "Today's Revenue",
      value:    fmtRs(data?.today_revenue),
      change:   fmtPct(data?.today_revenue_change_pct),
      positive: (data?.today_revenue_change_pct ?? 0) >= 0,
    },
    {
      title:    "Units Sold",
      value:    data?.units_sold_today ?? "—",
      change:   fmtPct(data?.units_sold_change_pct),
      positive: (data?.units_sold_change_pct ?? 0) >= 0,
    },
    {
      title:   "Low Stock Items",
      value:   data?.low_stock_items ?? "—",
      warning: (data?.low_stock_items ?? 0) > 0,
    },
    {
      title:    "Monthly Revenue",
      value:    fmtRs(data?.monthly_revenue),
      change:   fmtPct(data?.monthly_revenue_change_pct),
      positive: (data?.monthly_revenue_change_pct ?? 0) >= 0,
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c, i) => (
        <div className="kpi-card" key={i}>
          <p>{c.title}</p>
          <h2>{c.value}</h2>
          {c.change  && <span className={c.positive ? "positive" : "warning"}>{c.change}</span>}
          {c.warning && <span className="warning"> ⚠</span>}
        </div>
      ))}
    </div>
  );
}

export default KPIGrid;
