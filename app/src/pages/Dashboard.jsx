import "../styles/dashboard.css";

import Topbar from "../components/dashboard/Topbar";
import KPIGrid from "../components/dashboard/KPIGrid";
import SalesChart from "../components/dashboard/SalesChart";
import CategoryChart from "../components/dashboard/CategoryChart";
import ProductTable from "../components/dashboard/ProductTable";
import Alerts from "../components/dashboard/Alerts";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("rf_auth");
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <div className="dashboard">
        <Topbar onLogout={handleLogout} />
        <KPIGrid />

        <div className="chart-row">
          <SalesChart />
          <CategoryChart />
        </div>

        <div className="bottom-row">
          <ProductTable />
          <Alerts />
        </div>
      </div>

    </>
  );
}

export default Dashboard;