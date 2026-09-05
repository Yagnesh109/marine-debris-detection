import { useState } from "react";
import { Text } from "@react-three/drei";
import { calculateObjectGeoPosition } from "../../utils/geoUtils";
import { getTerrainY } from "../../utils/terrain";
import DetectionObject3D from "../ModelLoader";

function DepthGuide({ depth, startY, endY }) {
  const lineLength = Math.max(1, Math.abs(endY - startY));
  const centerY = (startY + endY) / 2;

  return (
    <group>
      <mesh position={[0, centerY, 0]}>
        <cylinderGeometry args={[0.08, 0.08, lineLength, 8]} />
        <meshBasicMaterial color="#73e6ff" transparent opacity={0.85} depthTest={false} />
      </mesh>
      <Text
        position={[2.2, centerY, 0]}
        fontSize={1.4}
        color="#b9f5ff"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.12}
        outlineColor="#06283d"
        depthOffset={-1}
      >
        {`${depth.toFixed(1)} m`}
      </Text>
    </group>
  );
}

export default function DetectionMarker({ detection, seabedDepth = 40, anchorX = 0, anchorZ = 0, onClick }) {
  const [hovered, setHovered] = useState(false);
  const geoInfo = calculateObjectGeoPosition({
    sonarRange: detection.sonar_range,
    sonarAzimuth: detection.sonar_azimuth,
    sonarElevation: detection.sonar_elevation,
    soundSpeed: detection.sonar_soundspeed,
    frequency: detection.sonar_frequency,
    depth: detection.depth,
    localX: detection.local_x,
    localZ: detection.local_z,
    vehicleLatitude: detection.latitude,
    vehicleLongitude: detection.longitude,
  });
  const displayX = geoInfo.x;
  const displayZ = geoInfo.z;
  const objectY = getTerrainY(displayX, displayZ, anchorX, anchorZ, seabedDepth);
  const measurementDepth = geoInfo.depth;
  const position = [displayX, objectY, displayZ];

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onClick(detection, geoInfo);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
      }}
    >
      <group>
        <DetectionObject3D detection={detection} scale={1.8} showLabel={false} />
      </group>
      <DepthGuide depth={measurementDepth} startY={-objectY} endY={0} />
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[0.3, 0, 4, 8]} />
        <meshStandardMaterial color={hovered ? "#ffaa00" : "#ffffff"} />
      </mesh>
      <mesh position={[8, 8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 16, 8]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>

      <Text position={[16, 8, 0]} fontSize={3} color="#ffffff" anchorX="left" anchorY="middle" outlineWidth={0.25} outlineColor="#06283d" maxWidth={32}>
          {detection.name || "Object"}
      </Text>
    </group>
  );
}