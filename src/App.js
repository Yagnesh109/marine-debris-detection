import { useState } from "react";
import './App.css';
import Dashboard from './pages/dashboard';
import MapPage from './pages/MapPage';
import Navbar from './pages/navbar';
import UploadPage from './pages/UploadPage';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [calculating, setCalculating] = useState(false);
  const [positionRefreshKey, setPositionRefreshKey] = useState(0);

  const calculatePositions = async () => {
    setCalculating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/calculate-position`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to calculate positions");
      }

      setPositionRefreshKey((key) => key + 1);
      setActiveTab("maps");
    } catch (err) {
      alert(err.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onCalculatePositions={calculatePositions}
        calculating={calculating}
      />
      <div style={{ height: "calc(100% - 64px)" }}>
        {activeTab === "maps" ? (
          <MapPage apiBaseUrl={API_BASE_URL} refreshKey={positionRefreshKey} />
        ) : activeTab === "upload" ? (
          <UploadPage />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

export default App;
