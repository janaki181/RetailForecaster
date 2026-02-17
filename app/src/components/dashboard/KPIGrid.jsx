import { kpis } from "../../data/dashboardData";

function KPIGrid() {
  return (
    <div className="kpi-grid">
      {kpis.map((kpi, i) => (
        <div className="kpi-card" key={i}>
          <p>{kpi.title}</p>
          <h2>{kpi.value}</h2>
          {kpi.change && <span className="positive">{kpi.change}</span>}
          {kpi.warning && <span className="warning">⚠</span>}
        </div>
      ))}
    </div>
  );
}

export default KPIGrid;