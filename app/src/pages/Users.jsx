import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { api } from "../api/client";

// FIXED: all data live from backend — no hardcoded user rows

function fmtLastSeen(ts) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Users() {
  const [summary, setSummary] = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");
  const [inviteOk, setInviteOk] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "Sales Associate" });

  const ROLES = ["Admin", "Store Manager", "Inventory Lead", "Sales Associate", "Analyst"];

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/users/summary"),
      api.get("/api/users"),
    ])
      .then(([s, u]) => {
        setSummary(s);
        setUsers(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr("");
    setInviteOk("");
    setSaving(true);
    try {
      const res = await api.post("/api/users/invite", form);
      setInviteOk(
        `✅ User invited! Temp password: ${res.temp_password}. Share this with them.`
      );
      setForm({ name: "", email: "", role: "Sales Associate" });
      load();
    } catch (err) {
      setFormErr(err.message || "Failed to invite user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard page-shell">
      {/* ── Header ─────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p className="topbar-subtitle">Team access, activity, and engagement</p>
        </div>
        <button className="page-action" onClick={() => { setShowForm(true); setInviteOk(""); setFormErr(""); }}>
          Invite User
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────── */}
      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card">
          <h4>Total Users</h4>
          <strong>{loading ? "—" : summary?.total_users ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Active Today</h4>
          <strong>{loading ? "—" : summary?.active_today ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>New This Week</h4>
          <strong>{loading ? "—" : summary?.new_this_week ?? "—"}</strong>
        </div>
        <div className="kpi-card">
          <h4>Admins</h4>
          <strong>{loading ? "—" : summary?.admins ?? "—"}</strong>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────── */}
      <div>
        {/* Team Directory */}
        <div className="card">
          <h3>Team Directory</h3>
          {loading ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Loading…</p>
          ) : (
            <table className="table-clean" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  return (
                    <tr key={i}>
                      <td>{u.name}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{u.email}</td>
                      <td>{u.role}</td>
                      <td style={{ fontSize: 12, color: "#9ca3af" }}>
                        {fmtLastSeen(u.last_seen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Invite User Modal ──────────────────── */}
      {showForm && (
        <div className="page-form-overlay">
          <div className="page-form-modal">
            <div className="page-form-header">
              <h3>Invite User</h3>
              <button className="page-form-close" onClick={() => setShowForm(false)}>Close</button>
            </div>
            <p className="page-form-description">
              A temporary password will be generated. Share it with the new team member.
            </p>

            {inviteOk ? (
              <div>
                <p style={{ color: "#15803d", fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
                  {inviteOk}
                </p>
                <div className="page-form-actions">
                  <button className="page-form-cancel" onClick={() => setShowForm(false)}>Close</button>
                  <button className="page-form-submit" onClick={() => setInviteOk("")}>Invite Another</button>
                </div>
              </div>
            ) : (
              <form className="page-form-body" onSubmit={handleSubmit}>
                <label className="page-form-field">
                  <span>Full Name *</span>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </label>
                <label className="page-form-field">
                  <span>Email *</span>
                  <input
                    type="email" required value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com"
                  />
                </label>
                <label className="page-form-field">
                  <span>Role</span>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                  >
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </label>

                {formErr && (
                  <p style={{ color: "#ef4444", fontSize: 13 }}>{formErr}</p>
                )}

                <div className="page-form-actions">
                  <button type="button" className="page-form-cancel" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="page-form-submit" disabled={saving}>
                    {saving ? "Inviting…" : "Send Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
