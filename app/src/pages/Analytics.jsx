import "../styles/dashboard.css";

function Analytics() {
  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="topbar-subtitle">Traffic, behavior, and forecast confidence trends</p>
        </div>
      </div>

      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card"><h4>Sessions (7D)</h4><strong>52,300</strong></div>
        <div className="kpi-card"><h4>Bounce Rate</h4><strong>31.6%</strong></div>
        <div className="kpi-card"><h4>Forecast Confidence</h4><strong>92.1%</strong></div>
        <div className="kpi-card"><h4>Returning Users</h4><strong>43%</strong></div>
      </div>

      <div className="page-grid">
        <div className="card">
          <h3>Performance Highlights</h3>
          <ul className="insight-list">
            <li>Organic traffic grew by 14% after new campaign landing pages.</li>
            <li>Checkout completion is strongest between 6 PM and 9 PM.</li>
            <li>Electronics users have the highest cart-to-purchase ratio.</li>
            <li>Mobile visitors account for 68% of total sessions.</li>
          </ul>
        </div>

        <div className="card">
          <h3>Recommended Actions</h3>
          <ul className="insight-list">
            <li>Increase ad spend for top-converting evening segments.</li>
            <li>Restock high-intent products in Beauty and Apparel.</li>
            <li>Launch repeat-buyer coupon for low-activity cohorts.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

export default Analytics;
