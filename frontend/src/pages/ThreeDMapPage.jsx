import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import DetectionMarker from "../components/threeD/DetectionMarker";
import Terrain from "../components/threeD/Terrain";

function DetectionDetails({ selectedObj, onClose }) {
  if (!selectedObj) return null;

  return (
    <div className="three-d-details">
      <h3>Object: {selectedObj.detection.name || "Unknown"}</h3>
      <p><strong>Confidence:</strong> {((selectedObj.detection.confidence || 0) * 100).toFixed(1)}%</p>
      <p><strong>Depth:</strong> {selectedObj.geoInfo.depth.toFixed(1)} m</p>
      <p><strong>Lat:</strong> {selectedObj.geoInfo.latitude.toFixed(6)}</p>
      <p><strong>Lon:</strong> {selectedObj.geoInfo.longitude.toFixed(6)}</p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}

function ViewerLegend({ onNavigate }) {
  return (
    <div className="three-d-legend">
      <h2>3D Bathymetric Map</h2>
      <div className="three-d-depth-legend">
        <span className="shallow">■</span> Shallow
        <span className="medium">■</span> Medium
        <span className="deep">■</span> Deep
      </div>
      <button type="button" onClick={() => onNavigate?.("dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default function ThreeDMapPage({ detections = [], onNavigate }) {
  const [selectedObj, setSelectedObj] = useState(null);

  return (
    <div className="three-d-page">
      <Canvas camera={{ position: [0, 60, 120], fov: 60 }}>
        <ambientLight intensity={0.4} color="#aaccff" />
        <hemisphereLight skyColor="#ffffff" groundColor="#000033" intensity={0.6} />
        <directionalLight position={[100, 100, 50]} intensity={0.8} castShadow />
        <gridHelper args={[500, 50, "#ffffff", "#ffffff"]} position={[0, -55, 0]} material-opacity={0.1} material-transparent />
        <mesh position={[0, -15, 0]}>
          <boxGeometry args={[500, 50, 500]} />
          <meshStandardMaterial color="#0088ff" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -105, 0]}>
          <boxGeometry args={[500, 100, 500]} />
          <meshStandardMaterial color="#000714" roughness={1} />
        </mesh>
        <Terrain />
        {detections.map((detection, index) => (
          <DetectionMarker
            key={`${detection.name}-${index}`}
            detection={detection}
            onClick={(object, geoInfo) => setSelectedObj({ detection: object, geoInfo })}
          />
        ))}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
      <DetectionDetails selectedObj={selectedObj} onClose={() => setSelectedObj(null)} />
      <ViewerLegend onNavigate={onNavigate} />
    </div>
  );
}
