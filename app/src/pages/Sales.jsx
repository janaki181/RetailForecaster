import { useState } from "react";
import "../styles/dashboard.css";
import PageFormModal from "../components/dashboard/PageFormModal";

const orders = [
  { id: "ORD-9012", customer: "Mia Johnson", channel: "Online", value: "$248", status: "Delivered" },
  { id: "ORD-9031", customer: "Arjun Patel", channel: "In-Store", value: "$119", status: "Packed" },
  { id: "ORD-9068", customer: "Sophia Lee", channel: "Online", value: "$342", status: "Shipped" },
  { id: "ORD-9099", customer: "Noah Walker", channel: "Marketplace", value: "$86", status: "Processing" },
];

function Sales() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Sales</h2>
          <p className="topbar-subtitle">Daily orders, channels, and conversion outcomes</p>
        </div>
        <button type="button" className="page-action" onClick={() => setIsFormOpen(true)}>Export Report</button>
      </div>

      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card"><h4>Today Revenue</h4><strong>$18,420</strong></div>
        <div className="kpi-card"><h4>Orders</h4><strong>264</strong></div>
        <div className="kpi-card"><h4>Avg. Order Value</h4><strong>$69.77</strong></div>
        <div className="kpi-card"><h4>Conversion Rate</h4><strong>4.9%</strong></div>
      </div>

      <div className="page-grid">
        <div className="card">
          <h3>Recent Orders</h3>
          <table className="table-clean">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Channel</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.channel}</td>
                  <td>{order.value}</td>
                  <td><span className="status-pill">{order.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Channel Mix</h3>
          <ul className="insight-list">
            <li>Online store contributes 56% of total sales volume.</li>
            <li>In-store sales are up 9% after weekend promotions.</li>
            <li>Marketplace has lower AOV but strongest new-customer intake.</li>
          </ul>
        </div>
      </div>

      <PageFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Sales Report Filters"
        description="Add details for a report request. Submission currently closes the form only."
        submitLabel="Apply"
        fields={[
          { name: "dateRange", label: "Date Range", placeholder: "e.g. Last 30 days" },
          { name: "channel", label: "Channel", placeholder: "Online / In-Store / Marketplace" },
          { name: "region", label: "Region", placeholder: "Enter region" },
          { name: "comments", label: "Comments", type: "textarea", placeholder: "Extra notes" },
        ]}
      />
    </div>
  );
}

export default Sales;
