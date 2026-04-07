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
              legend: { display: true, position: "top" },
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
      <h3>
        Sales Overview{" "}
        {loading && <span style={{ fontSize: 12, color: "#9ca3af" }}>loading…</span>}
      </h3>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default SalesChart;
