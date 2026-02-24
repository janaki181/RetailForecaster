import { useState } from "react";
import "../styles/dashboard.css";
import PageFormModal from "../components/dashboard/PageFormModal";

const productRows = [
  { sku: "SKU-1001", name: "Classic Denim Jacket", category: "Apparel", stock: 148, trend: "+12%" },
  { sku: "SKU-1044", name: "Wireless Earbuds Pro", category: "Electronics", stock: 64, trend: "+8%" },
  { sku: "SKU-1198", name: "Herbal Skin Serum", category: "Beauty", stock: 39, trend: "+15%" },
  { sku: "SKU-1210", name: "Office Desk Lamp", category: "Home", stock: 91, trend: "+6%" },
];

function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="dashboard page-shell">
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="topbar-subtitle">Catalog performance and stock health</p>
        </div>
        <button type="button" className="page-action" onClick={() => setIsFormOpen(true)}>Add Product</button>
      </div>

      <div className="kpi-grid page-kpi-grid">
        <div className="kpi-card"><h4>Active SKUs</h4><strong>1,248</strong></div>
        <div className="kpi-card"><h4>Top Category</h4><strong>Apparel</strong></div>
        <div className="kpi-card"><h4>Low Stock Items</h4><strong className="warning-text">36</strong></div>
        <div className="kpi-card"><h4>Avg. Margin</h4><strong>27.4%</strong></div>
      </div>

      <div className="page-grid">
        <div className="card">
          <h3>Best Performing Products</h3>
          <table className="table-clean">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>7D Trend</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((item) => (
                <tr key={item.sku}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.stock}</td>
                  <td className="positive">{item.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Product Notes</h3>
          <ul className="insight-list">
            <li>Winter jackets are trending ahead of forecast by 11% this week.</li>
            <li>Beauty category has the highest repeat purchase ratio this month.</li>
            <li>Home accessories show stable demand with low return rates.</li>
          </ul>
        </div>
      </div>

      <PageFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add Product"
        description="Fill in product details. This form is currently for drafting input only."
        submitLabel="Save Draft"
        fields={[
          { name: "productName", label: "Product Name", placeholder: "Enter product name" },
          { name: "sku", label: "SKU", placeholder: "Enter SKU" },
          { name: "category", label: "Category", placeholder: "Enter category" },
          { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional notes" },
        ]}
      />
    </div>
  );
}

export default Products;
