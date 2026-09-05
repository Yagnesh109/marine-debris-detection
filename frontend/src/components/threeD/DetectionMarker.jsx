import { useState } from "react";
import { Text } from "@react-three/drei";
import { calculateObjectGeoPosition } from "../../utils/geoUtils";
import DetectionObject3D, { hasModelForDetection } from "../ModelLoader";

function DepthGuide({ depth, floorY }) {
  const floorDepth = Math.max(0, -floorY);

  return (
    <group>
      <mesh position={[0, floorDepth / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, floorDepth, 8]} />
        <meshBasicMaterial color="#73e6ff" transparent opacity={0.75} />
      </mesh>
      <Text
        position={[2, floorDepth / 2, 0]}
        fontSize={2.2}
        color="#b9f5ff"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.18}
        outlineColor="#06283d"
      >
        {`${depth.toFixed(1)} m depth`}
      </Text>
    </group>
  );
}

export default function DetectionMarker({ detection, onClick }) {
  const [hovered, setHovered] = useState(false);
  const geoInfo = calculateObjectGeoPosition({
    sonarRange: detection.sonar_range,
    sonarAzimuth: detection.sonar_azimuth,
    depth: detection.depth,
    localX: detection.local_x,
    localZ: detection.local_z,
    vehicleLatitude: detection.latitude,
    vehicleLongitude: detection.longitude,
  });
  const floorY = -geoInfo.depth;
  const position = [geoInfo.x, floorY, geoInfo.z];
  const objectName = detection.name?.toLowerCase().trim();
  const modelAvailable = hasModelForDetection(objectName);

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
        <DetectionObject3D detection={detection} scale={2} showLabel={false} />
      </group>
      <DepthGuide depth={geoInfo.depth} floorY={floorY} />
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
      {!modelAvailable && (
        <Text
          position={[16, 4, 0]}
          fontSize={1.8}
          color="#ffd166"
          anchorX="left"
          anchorY="middle"
          maxWidth={30}
          outlineWidth={0.15}
          outlineColor="black"
        >
          {`3D model not available for ${detection.name || "object"}`}
        </Text>
      )}
    </group>
  );
}