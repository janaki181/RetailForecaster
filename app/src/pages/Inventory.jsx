import { useState } from "react";
import "../styles/dashboard.css";
import PageFormModal from "../components/dashboard/PageFormModal";

const inventoryRows = [
  { name: "Denim Jacket", location: "Warehouse A", onHand: 148, reorder: "No" },
  { name: "Earbuds Pro", location: "Warehouse B", onHand: 64, reorder: "Soon" },
  { name: "Skin Serum", location: "Warehouse A", onHand: 39, reorder: "Yes" },
  { name: "Desk Lamp", location: "Warehouse C", onHand: 91, reorder: "No" },
];

function Inventory() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <p className="topbar-subtitle">Stock coverage and reorder priorities</p>
        </div>
        <button type="button" className="page-action" onClick={() => setIsFormOpen(true)}>Create PO</button>
      </div>

      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card"><h4>Total Units</h4><strong>18,942</strong></div>
        <div className="kpi-card"><h4>Days of Cover</h4><strong>23</strong></div>
        <div className="kpi-card"><h4>Reorder Required</h4><strong className="warning-text">12 SKUs</strong></div>
        <div className="kpi-card"><h4>Warehouse Fill</h4><strong>74%</strong></div>
      </div>

      <div className="page-grid">
        <div className="card">
          <h3>Stock by Location</h3>
          <table className="table-clean">
            <thead>
              <tr>
                <th>Item</th>
                <th>Location</th>
                <th>On Hand</th>
                <th>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.location}</td>
                  <td>{item.onHand}</td>
                  <td>
                    <span className={`status-pill ${item.reorder === "Yes" ? "danger" : ""}`}>
                      {item.reorder}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Inventory Alerts</h3>
          <ul className="insight-list">
            <li>Skin Serum is below safety stock threshold.</li>
            <li>Earbuds Pro is projected to stock out in 5 days.</li>
            <li>Footwear category has balanced supply for next 3 weeks.</li>
          </ul>
        </div>
      </div>

      <PageFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create Purchase Order"
        description="Fill order details. This form is for data entry only right now."
        submitLabel="Save Draft"
        fields={[
          { name: "supplier", label: "Supplier", placeholder: "Supplier name" },
          { name: "item", label: "Item", placeholder: "Item or SKU" },
          { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
          { name: "remarks", label: "Remarks", type: "textarea", placeholder: "Optional remarks" },
        ]}
      />
    </div>
  );
}

export default Inventory;
