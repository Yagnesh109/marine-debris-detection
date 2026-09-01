import { useState } from "react";
import './App.css';
import Dashboard from './pages/dashboard';
import MapPage from './pages/MapPage';
import Navbar from './pages/navbar';
import UploadPage from './pages/UploadPage';
import ThreeDMapPage from './pages/ThreeDMapPage';

// Everything (including position calculation) is served by the FastAPI backend.
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const AI_API_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || "http://localhost:8000";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [calculating, setCalculating] = useState(false);
  const [positionRefreshKey, setPositionRefreshKey] = useState(0);
  const [detections, setDetections] = useState([]);

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
      {/* Scrollable page area: every tab can grow and scroll here */}
      <div style={{ height: "calc(100% - 64px)", overflowY: "auto" }}>
        {activeTab === "maps" ? (
          <MapPage
            apiBaseUrl={API_BASE_URL}
            refreshKey={positionRefreshKey}
            detectionPoints={detections}
          />
        ) : activeTab === "3d-map" ? (
          <ThreeDMapPage 
            detections={detections}
            onNavigate={setActiveTab}
          />
        ) : activeTab === "upload" ? (
          <UploadPage
            aiApiBaseUrl={AI_API_BASE_URL}
            onDetectionComplete={(result) => setDetections(result.objects_detected || [])}
            onNavigate={setActiveTab}
          />
        ) : (
          <Dashboard aiApiBaseUrl={AI_API_BASE_URL} onNavigate={setActiveTab} />
        )}
      </div>
    </div>
  );
}

export default App;
