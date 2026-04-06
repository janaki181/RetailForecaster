import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { api } from "../api/client";

// FIXED: reads real settings from GET /api/settings on mount
// FIXED: Save buttons call PUT /api/settings for each key

function SettingRow({ label, settingKey, value, onSave, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value ?? "");
  const [saving, setSaving]   = useState(false);

  useEffect(() => { setVal(value ?? ""); }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(settingKey, String(val));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 12px", borderRadius: 8, background: "#f8fafc", marginBottom: 8,
    }}>
      <div>
        <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
        {!editing && (
          <strong style={{ display: "block", fontSize: 14, marginTop: 2 }}>
            {value ?? "—"}
          </strong>
        )}
        {editing && (
          <input
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            style={{
              marginTop: 4, padding: "4px 8px",
              border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: 180,
            }}
          />
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {editing ? (
          <>
            <button
              onClick={save}
              disabled={saving}
              style={{
                background: "#4f46e5", color: "#fff", border: "none",
                borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer",
              }}
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setVal(value ?? ""); }}
              style={{
                background: "#e2e8f0", color: "#0f172a", border: "none",
                borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: "transparent", border: "1px solid #cbd5e1",
              borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer",
            }}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saveMsg,  setSaveMsg]  = useState("");

  useEffect(() => {
    api.get("/api/settings")
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key, value) => {
    await api.put("/api/settings", { key, value });
    setSaveMsg(`✅ "${key}" updated.`);
    setTimeout(() => setSaveMsg(""), 3000);
    // Refresh
    api.get("/api/settings").then(setSettings).catch(() => {});
  };

  if (loading) {
    return (
      <div className="dashboard page-shell">
        <div className="page-header"><div><h2>Settings</h2></div></div>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading settings…</p>
      </div>
    );
  }

  const s = settings;

  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="topbar-subtitle">System preferences and operational controls</p>
        </div>
      </div>

      {saveMsg && (
        <p style={{
          color: "#15803d", fontWeight: 600, fontSize: 13,
          marginBottom: 14, padding: "8px 12px",
          background: "#f0fdf4", borderRadius: 8,
        }}>
          {saveMsg}
        </p>
      )}

      <div className="settings-grid">
        {/* Store Preferences */}
        <div className="card">
          <h3>Store Preferences</h3>
          <div style={{ marginTop: 12 }}>
            <SettingRow label="Default Currency"  settingKey="currency"         value={s?.store?.currency}         onSave={handleSave} />
            <SettingRow label="Timezone"          settingKey="timezone"         value={s?.store?.timezone}         onSave={handleSave} />
            <SettingRow label="Forecast Horizon"  settingKey="forecast_horizon" value={String(s?.store?.forecast_horizon ?? "")} onSave={handleSave} type="number" />
            <SettingRow label="Warehouse Capacity" settingKey="max_warehouse_capacity" value={String(s?.inventory?.max_warehouse_capacity ?? "")} onSave={handleSave} type="number" />
            <SettingRow label="Safety Buffer Days" settingKey="safety_buffer_days" value={String(s?.inventory?.safety_buffer_days ?? "")} onSave={handleSave} type="number" />
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h3>Notifications</h3>
          <div style={{ marginTop: 12 }}>
            <SettingRow label="Low Stock Alerts"    settingKey="low_stock_alerts"    value={s?.notifications?.low_stock_alerts ? "true" : "false"}    onSave={handleSave} />
            <SettingRow label="Daily Sales Summary" settingKey="daily_sales_summary" value={s?.notifications?.daily_sales_summary ? "true" : "false"} onSave={handleSave} />
            <SettingRow label="Anomaly Alerts"      settingKey="anomaly_alerts"      value={s?.notifications?.anomaly_alerts ? "true" : "false"}      onSave={handleSave} />
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h3>Security</h3>
          <div style={{ marginTop: 12 }}>
            <SettingRow label="2FA Required"          settingKey="two_fa_required"       value={s?.security?.two_fa_required ? "true" : "false"}       onSave={handleSave} />
            <SettingRow label="Session Timeout (min)" settingKey="session_timeout"       value={String(s?.security?.session_timeout ?? "")}             onSave={handleSave} type="number" />
            <SettingRow label="Password Rotation Days" settingKey="password_rotation_days" value={String(s?.security?.password_rotation_days ?? "")}   onSave={handleSave} type="number" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
