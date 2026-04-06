import { useEffect, useState } from "react";
import { api } from "../../api/client";

function ProductTable() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/api/products/top-performing")
      .then((data) => setProducts(data.slice(0, 5)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const trendColor = (pct) => {
    if (pct == null) return "#6b7280";
    return pct >= 0 ? "#16a34a" : "#dc2626";
  };

  return (
    <div className="card">
      <h3>
        Top Selling Products{" "}
        {loading && <span style={{ fontSize: 12, color: "#9ca3af" }}>loading…</span>}
      </h3>

      {!loading && products.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>No product data yet.</p>
      )}

      {products.length > 0 && (
        <table className="table-clean" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Stock</th>
              <th>7D Trend</th>
              <th>Next 7D Forecast</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.stock}</td>
                <td style={{ color: trendColor(p.trend_7d_pct), fontWeight: 600 }}>
                  {p.trend_7d_pct != null
                    ? (p.trend_7d_pct >= 0 ? "+" : "") + p.trend_7d_pct.toFixed(1) + "%"
                    : "—"}
                </td>
                <td style={{ color: "#475569" }}>
                  {p.forecast_next_7d > 0 ? `${Math.round(p.forecast_next_7d)} units` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductTable;
