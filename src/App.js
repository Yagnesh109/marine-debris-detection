import { useState } from "react";
import './App.css';
import Dashboard from './pages/dashboard';
import MapPage from './pages/MapPage';
import Navbar from './pages/navbar';

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      <div style={{ height: "calc(100% - 64px)" }}>
        {activeTab === "maps" ? (
          <MapPage />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

export default App;
