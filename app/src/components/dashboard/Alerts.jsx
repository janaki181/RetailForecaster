import { useEffect, useState } from "react";
import { api } from "../../api/client";

const URGENCY_COLOR = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#6b7280" };
const URGENCY_BG    = { Critical: "#fee2e2", High: "#ffedd5", Medium: "#fef9c3", Low: "#f3f4f6" };

function Alerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/demand-alerts")
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h3>ML Demand Alerts</h3>

      {loading && (
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading alerts…</p>
      )}

      {!loading && alerts.length === 0 && (
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
          ✅ No urgent alerts right now.
        </p>
      )}

      {alerts.map((a, i) => (
        <div
          key={i}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: URGENCY_BG[a.urgency] || "#f3f4f6",
            marginTop: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 13 }}>{a.product}</strong>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: URGENCY_COLOR[a.urgency] || "#6b7280",
              }}
            >
              {a.urgency}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{a.alert}</p>
        </div>
      ))}
    </div>
  );
}

export default Alerts;
