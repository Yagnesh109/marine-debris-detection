import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { calculateObjectGeoPosition } from '../utils/geoUtils';

// Helper function to get exact terrain height at any X, Z coordinate
function getTerrainY(x, z) {
  const y1 = Math.sin(x / 100) * 12 + Math.cos(z / 100) * 12;
  const y2 = Math.sin((x + z) / 50) * 5;
  return y1 + y2 - 40;
}

/**
 * Synthetic 3D Terrain
 */
function Terrain() {
  // Generate a continuous 3D seabed terrain
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(500, 500, 100, 100);
    geo.rotateX(-Math.PI / 2);
    
    // Add some noise for seabed variation
    const positions = geo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = getTerrainY(x, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Depth color gradient (oceanic blues)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: true, // Gives a nice low-poly/topographic look
      roughness: 0.9,
      metalness: 0.1,
    });
  }, []);

  const coloredGeometry = useMemo(() => {
    const geo = geometry.clone();
    const positions = geo.attributes.position.array;
    const colors = new Float32Array(positions.length);
    
    const color = new THREE.Color();
    const shallowColor = new THREE.Color('#00aaff'); // Light blue
    const mediumColor = new THREE.Color('#0055aa'); // Mid blue
    const deepColor = new THREE.Color('#001144'); // Dark blue

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      
      // Normalize depth roughly from -65 (deep) to -15 (shallow)
      const normalizedHeight = Math.max(0, Math.min(1, (y + 60) / 40)); 
      
      if (normalizedHeight > 0.5) {
        // interpolate medium to shallow
        const t = (normalizedHeight - 0.5) * 2; 
        color.lerpColors(mediumColor, shallowColor, t);
      } else {
        // interpolate deep to medium
        const t = normalizedHeight * 2; 
        color.lerpColors(deepColor, mediumColor, t);
      }

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [geometry]);

  return (
    <group>
      {/* Solid colored mesh */}
      <mesh geometry={coloredGeometry} material={material} receiveShadow />
      {/* Subtle wireframe overlay for topographic feel */}
      <mesh geometry={coloredGeometry}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

/**
 * Marker for detection
 */
function DetectionMarker({ detection, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  // Calculate spatial info
  const geoInfo = calculateObjectGeoPosition({
    ...detection,
    // Using missing/existing values
    vehicleLatitude: null, // will use DEMO
    vehicleLongitude: null,
    vehicleHeading: null,
    sonarRange: null,
    sonarAzimuth: null,
    depth: null
  });
  
  // Plot at calculated local position (X and Z from telemetry, Y precisely matched to terrain)
  const surfaceY = getTerrainY(geoInfo.x, geoInfo.z);
  const position = [geoInfo.x, surfaceY, geoInfo.z];

  return (
    <group position={position}>
      {/* Pin head */}
      <mesh
        position={[0, 4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(detection, geoInfo);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial color={hovered ? "hotpink" : "#ff3333"} emissive={hovered ? "hotpink" : "#ff3333"} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Pin stalk dropping to seabed */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.2, 0, 4, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Label above the marker */}
      <Text position={[0, 7, 0]} fontSize={2.5} color="white" anchorX="center" anchorY="middle" outlineWidth={0.2} outlineColor="black">
        {detection.name || 'Object'}
      </Text>
    </group>
  );
}

/**
 * 3D Bathymetric Viewer Component
 */
export default function ThreeDMapPage({ detections = [], onNavigate }) {
  const [selectedObj, setSelectedObj] = useState(null);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#0a192f' }}>
      <Canvas camera={{ position: [0, 60, 120], fov: 60 }}>
        {/* Underwater-like lighting */}
        <ambientLight intensity={0.4} color="#aaccff" />
        <hemisphereLight skyColor="#ffffff" groundColor="#000033" intensity={0.6} />
        <directionalLight position={[100, 100, 50]} intensity={0.8} castShadow />
        
        {/* Add a grid to help with scale and depth perception */}
        <gridHelper args={[500, 50, '#ffffff', '#ffffff']} position={[0, -55, 0]} material-opacity={0.1} material-transparent={true} />
        
        {/* Ocean Volume Diorama Sides */}
        <mesh position={[0, -15, 0]}>
          <boxGeometry args={[500, 50, 500]} />
          <meshStandardMaterial color="#0088ff" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Deep Earth Base */}
        <mesh position={[0, -105, 0]}>
          <boxGeometry args={[500, 100, 500]} />
          <meshStandardMaterial color="#000714" roughness={1} />
        </mesh>

        <Terrain />
        
        {detections.map((det, idx) => (
          <DetectionMarker 
            key={idx} 
            detection={det} 
            onClick={(d, g) => setSelectedObj({ detection: d, geoInfo: g })}
          />
        ))}

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={10} 
          maxDistance={300} 
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going under the terrain
        />
      </Canvas>

      {/* Detection information popup/panel */}
      {selectedObj && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #444',
          minWidth: '200px',
          pointerEvents: 'auto',
          zIndex: 10
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ff4444' }}>
            🔴 {selectedObj.detection.name || 'Unknown'}
          </h3>
          <p style={{ margin: '5px 0' }}>
            <strong>Confidence:</strong> {((selectedObj.detection.confidence || 0) * 100).toFixed(1)}%
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Depth:</strong> {selectedObj.geoInfo.depth.toFixed(1)} m
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Lat:</strong> {selectedObj.geoInfo.latitude.toFixed(6)}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Lon:</strong> {selectedObj.geoInfo.longitude.toFixed(6)}
          </p>
          <button 
            onClick={() => setSelectedObj(null)}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Close
          </button>
        </div>
      )}
      
      {/* Legend / Title */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '8px',
        pointerEvents: 'auto',
        zIndex: 10
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>3D Bathymetric Map</h2>
        <div style={{ fontSize: '12px', marginTop: '5px', marginBottom: '10px' }}>
          <span style={{ color: '#00aaff' }}>■</span> Shallow 
          <span style={{ color: '#0055aa', marginLeft: '10px' }}>■</span> Medium 
          <span style={{ color: '#001144', marginLeft: '10px' }}>■</span> Deep
        </div>
        <button
          onClick={() => {
            if (onNavigate) onNavigate('upload');
          }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Back to Upload
        </button>
      </div>
    </div>
  );
}
