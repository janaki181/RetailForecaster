import "../styles/dashboard.css";

function Settings() {
  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="topbar-subtitle">System preferences and operational controls</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <h3>Store Preferences</h3>
          <ul className="insight-list">
            <li>Default currency: USD</li>
            <li>Timezone: UTC -05:00</li>
            <li>Forecast horizon: 30 days</li>
          </ul>
        </div>

        <div className="card">
          <h3>Notifications</h3>
          <ul className="insight-list">
            <li>Low stock alerts: Enabled</li>
            <li>Daily sales summary: Enabled</li>
            <li>Critical anomaly alerts: Enabled</li>
          </ul>
        </div>

        <div className="card">
          <h3>Security</h3>
          <ul className="insight-list">
            <li>2-factor authentication: Required for admins</li>
            <li>Session timeout: 30 minutes</li>
            <li>Password rotation: Every 90 days</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

export default Settings;
