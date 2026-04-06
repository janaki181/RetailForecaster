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
          type: "pie",
          data: {
            labels,
            datasets: [{ data: values, backgroundColor: COLORS.slice(0, values.length) }],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
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
        Sales by Category{" "}
        {loading && <span style={{ fontSize: 12, color: "#9ca3af" }}>loading…</span>}
      </h3>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default CategoryChart;
