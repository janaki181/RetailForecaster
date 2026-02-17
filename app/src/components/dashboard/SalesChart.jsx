import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { salesData } from "../../data/dashboardData";

function SalesChart() {
  const chartRef = useRef();

  useEffect(() => {
    const chart = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: ["Apr 10","Apr 12","Apr 14","Apr 16","Apr 18","Apr 20","Apr 22"],
        datasets: [{
          data: salesData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.1)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: true
      }
    });

    return () => chart.destroy();
  }, []);

  return (
    <div className="card">
      <h3>Sales Overview</h3>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default SalesChart;