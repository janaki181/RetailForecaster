import { topProducts } from "../../data/dashboardData";

function ProductTable() {
  return (
    <div className="card">
      <h3>Top Selling Products</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Units</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {topProducts.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <td>{p.units}</td>
              <td>{p.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;