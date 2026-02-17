import { alerts } from "../../data/dashboardData";

function Alerts() {
  return (
    <div className="card">
      <h3>Low Stock Alerts</h3>
      {alerts.map((a, i) => (
        <p key={i}>
          <span className="alert-icon">⚠</span>
          {a.name} ({a.left} left)
        </p>
      ))}
    </div>
  );
}

export default Alerts;