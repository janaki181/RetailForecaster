import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { categoryData } from "../../data/dashboardData";

function CategoryChart() {
  const chartRef = useRef();

  useEffect(() => {
    const total = categoryData.values.reduce((sum, value) => sum + value, 0);
    const labelsWithPercent = categoryData.labels.map((label, index) => {
      const value = categoryData.values[index];
      const percent = total ? Math.round((value / total) * 100) : 0;
      return `${label} (${percent}%)`;
    });

    const chart = new Chart(chartRef.current, {
      type: "pie",
      data: {
        labels: labelsWithPercent,
        datasets: [{
          data: categoryData.values,
          backgroundColor: ["#22c55e","#3b82f6","#f97316","#facc15"]
        }]
      }
    });

    return () => chart.destroy();
  }, []);

  return (
    <div className="card">
      <h3>Sales by Category</h3>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default CategoryChart;