import { useState } from "react";
import "../styles/dashboard.css";
import PageFormModal from "../components/dashboard/PageFormModal";

const userRows = [
  { name: "Ava Thompson", role: "Store Manager", status: "Active", lastSeen: "5 min ago" },
  { name: "Liam Carter", role: "Inventory Lead", status: "Active", lastSeen: "12 min ago" },
  { name: "Emma Green", role: "Sales Associate", status: "Away", lastSeen: "34 min ago" },
  { name: "Lucas Hall", role: "Analyst", status: "Active", lastSeen: "1 hour ago" },
];

function Users() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p className="topbar-subtitle">Team access, activity, and engagement</p>
        </div>
        <button type="button" className="page-action" onClick={() => setIsFormOpen(true)}>Invite User</button>
      </div>

      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card"><h4>Total Users</h4><strong>84</strong></div>
        <div className="kpi-card"><h4>Active Today</h4><strong>47</strong></div>
        <div className="kpi-card"><h4>New This Week</h4><strong>9</strong></div>
        <div className="kpi-card"><h4>Admins</h4><strong>6</strong></div>
      </div>

      <div className="page-grid">
        <div className="card">
          <h3>Team Directory</h3>
          <table className="table-clean">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((user) => (
                <tr key={user.name}>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td><span className="status-pill">{user.status}</span></td>
                  <td>{user.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>User Activity Notes</h3>
          <ul className="insight-list">
            <li>Manager logins increase during morning stock audits.</li>
            <li>Analyst users export weekly reports every Monday afternoon.</li>
            <li>Support requests are down after last permission update.</li>
          </ul>
        </div>
      </div>

      <PageFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Invite User"
        description="Enter user details to draft an invitation."
        submitLabel="Create Draft Invite"
        fields={[
          { name: "fullName", label: "Full Name", placeholder: "Enter full name" },
          { name: "email", label: "Email", type: "email", placeholder: "name@company.com" },
          { name: "role", label: "Role", placeholder: "e.g. Store Manager" },
          { name: "message", label: "Message", type: "textarea", placeholder: "Optional invitation note" },
        ]}
      />
    </div>
  );
}

export default Users;
