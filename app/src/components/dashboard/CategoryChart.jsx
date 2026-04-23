import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { api } from "../../api/client";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#facc15", "#8b5cf6", "#06b6d4", "#ef4444"];

function CategoryChart() {
  const canvasRef     = useRef();
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/category-performance")
      .then((rows) => {
        if (chartInstance.current) chartInstance.current.destroy();

        const labels = rows.map((r) => `${r.category} (${r.revenue_pct}%)`);
        const values = rows.map((r) => r.revenue_pct);

        chartInstance.current = new Chart(canvasRef.current, {
          type: "doughnut",
          data: {
            labels,
            datasets: [{ data: values, backgroundColor: COLORS.slice(0, values.length) }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
                align: "end",
                labels: {
                  color: "#64748b",
                  font: { size: 11, weight: "600" },
                  padding: 14,
                  boxWidth: 14,
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
                },
              },
            },
          },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  return (
    <div className="card">
      <p className="section-label">Category Mix</p>
      <div className="card-head">
        <div className="card-title-wrap">
          <h3>Sales by Category</h3>
          <span className="card-badge">Contribution %</span>
        </div>
        {loading && <span className="loading-chip">Loading...</span>}
      </div>
      <p className="card-meta">Share of revenue by product category</p>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default CategoryChart;
