import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function DashboardPreview({ onLoginClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            data: [32, 45, 38, 52, 48, 55, 62],
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79,70,229,0.1)",
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    });

    return () => chart.destroy();
  }, []);

  return (
    <section id="dashboard" className="dashboard-section">
      <div className="container">
        <h2 className="section-title">Experience the Dashboard</h2>
        <p className="section-subtitle">
          Intuitive, powerful, and built for real-world retail
        </p>

        <div className="dashboard-preview">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dot" />
              <div className="mockup-dot" />
              <div className="mockup-dot" />
            </div>

            <div className="mockup-content">
              <div className="preview-chart">
                <canvas ref={canvasRef}></canvas>
              </div>
            </div>
          </div>
        </div>

        <button className="cta-button secondary" onClick={onLoginClick}>
          Login / Sign Up
        </button>
      </div>
    </section>
  );
}

export default DashboardPreview;
