import { useState } from "react";
import './App.css';
import MapComponent from './pages/MapComponent';
import Dashboard from './pages/dashboard';
import Navbar from './pages/navbar';
import routeData from './data/solapurRoute.json';

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      <div style={{ height: "calc(100% - 64px)" }}>
        {activeTab === "maps" ? (
          <MapComponent
            routeData={routeData}
            pathColor="#FF5722"
            showMarkers={true}
          />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

export default App;
