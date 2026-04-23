import "../styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";

import Topbar from "../components/dashboard/Topbar";
import KPIGrid from "../components/dashboard/KPIGrid";
import SalesChart from "../components/dashboard/SalesChart";
import CategoryChart from "../components/dashboard/CategoryChart";
import ProductTable from "../components/dashboard/ProductTable";
import Alerts from "../components/dashboard/Alerts";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState({ labels: [], actual_values: [], forecast_values: [] });
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [summaryData, salesTrendData, categoryData, alertData, topData] = await Promise.all([
          api.get("/api/dashboard/summary"),
          api.get("/api/dashboard/sales-trend"),
          api.get("/api/dashboard/category-performance"),
          api.get("/api/dashboard/demand-alerts"),
          api.get("/api/products/top-performing"),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(summaryData);
        setSalesTrend(salesTrendData || { labels: [], actual_values: [], forecast_values: [] });
        setCategories(categoryData || []);
        setAlerts(alertData || []);
        setTopProducts(
          (topData || []).slice(0, 5).map((item) => ({
            name: item.name,
            units: item.forecast_next_7d ?? 0,
            revenue: `${item.trend_7d_pct ?? 0}%`,
          }))
        );
      } catch (_err) {
        if (!isMounted) {
          return;
        }
        setSummary(null);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        title: "Today's Revenue",
        value: `Rs ${Number(summary.today_revenue || 0).toLocaleString()}`,
        change:
          summary.today_revenue_change_pct == null
            ? null
            : `${summary.today_revenue_change_pct.toFixed(1)}%`,
      },
      {
        title: "Units Sold",
        value: `${summary.units_sold_today || 0}`,
        change:
          summary.units_sold_change_pct == null
            ? null
            : `${summary.units_sold_change_pct.toFixed(1)}%`,
      },
      {
        title: "Low Stock Items",
        value: `${summary.low_stock_items || 0}`,
        warning: (summary.low_stock_items || 0) > 0,
      },
      {
        title: "Monthly Revenue",
        value: `Rs ${Number(summary.monthly_revenue || 0).toLocaleString()}`,
        change:
          summary.monthly_revenue_change_pct == null
            ? null
            : `${summary.monthly_revenue_change_pct.toFixed(1)}%`,
      },
    ];
  }, [summary]);

  const handleLogout = () => {
    localStorage.removeItem("rf_auth");
    localStorage.removeItem("rf_token");
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <div className="dashboard page-shell">
        <Topbar onLogout={handleLogout} />

        <p className="section-label">Overview</p>
        <KPIGrid kpis={kpis} />

        <p className="section-label">Demand Forecast</p>
        <div className="chart-row">
          <SalesChart
            labels={salesTrend.labels || []}
            actualValues={salesTrend.actual_values || []}
            forecastValues={salesTrend.forecast_values || []}
          />
          <CategoryChart categories={categories} />
        </div>

        <p className="section-label">Intelligence</p>
        <div className="bottom-row">
          <ProductTable topProducts={topProducts} />
          <Alerts alerts={alerts} />
        </div>
      </div>

    </>
  );
}

export default Dashboard;