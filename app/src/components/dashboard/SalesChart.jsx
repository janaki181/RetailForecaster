import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { api } from "../../api/client";

function SalesChart() {
  const canvasRef      = useRef();
  const chartInstance  = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/sales-trend")
      .then((data) => {
        if (chartInstance.current) chartInstance.current.destroy();

        const shortLabels = data.labels.map((l) => {
          const d = new Date(l);
          return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
        });

        chartInstance.current = new Chart(canvasRef.current, {
          type: "line",
          data: {
            labels: shortLabels,
            datasets: [
              {
                label:           "Actual Revenue",
                data:            data.actual_values,
                borderColor:     "#3b82f6",
                backgroundColor: "rgba(59,130,246,0.08)",
                fill:            true,
                tension:         0.4,
                pointRadius:     2,
              },
              {
                label:           "ML Forecast",
                data:            data.forecast_values,
                borderColor:     "#8b5cf6",
                backgroundColor: "transparent",
                borderDash:      [6, 3],
                tension:         0.4,
                pointRadius:     2,
              },
            ],
          },
          options: {
            responsive: true,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                display: true,
                position: "top",
                align: "end",
                labels: {
                  color: "#64748b",
                  font: { size: 11, weight: "600" },
                  padding: 16,
                  boxWidth: 18,
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: Rs ${Number(ctx.raw || 0).toLocaleString("en-IN")}`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (v) =>
                    "Rs " + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 }),
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
      <p className="section-label">Revenue Trend</p>
      <div className="card-head">
        <div className="card-title-wrap">
          <h3>Sales Overview</h3>
          <span className="card-badge">Last 30 Days</span>
        </div>
        {loading && <span className="loading-chip">Loading...</span>}
      </div>
      <p className="card-meta">Actual revenue vs ML forecast</p>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default SalesChart;
