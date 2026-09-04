import { useState } from "react";
import { Text } from "@react-three/drei";
import { calculateObjectGeoPosition } from "../../utils/geoUtils";
import { getTerrainY } from "../../utils/terrain";
import DetectionObject3D, { hasModelForDetection } from "../ModelLoader";

export default function DetectionMarker({ detection, onClick }) {
  const [hovered, setHovered] = useState(false);
  const geoInfo = calculateObjectGeoPosition({
    ...detection,
    vehicleLatitude: null,
    vehicleLongitude: null,
    vehicleHeading: null,
    sonarRange: null,
    sonarAzimuth: null,
    depth: null,
  });
  const position = [geoInfo.x, getTerrainY(geoInfo.x, geoInfo.z) + 2, geoInfo.z];
  const objectName = detection.name?.toLowerCase().trim();
  const modelAvailable = hasModelForDetection(objectName);
  const labelHeight = ["ship", "ship wreck", "wreck"].includes(objectName)
    ? 42
    : objectName === "human body" ? 30 : 26;

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
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[0.3, 0, 4, 8]} />
        <meshStandardMaterial color={hovered ? "#ffaa00" : "#ffffff"} />
      </mesh>
      <Text position={[0, labelHeight, 0]} fontSize={3} color="white" anchorX="center" anchorY="middle" outlineWidth={0.25} outlineColor="black">
        {detection.name || "Object"}
      </Text>
      {!modelAvailable && (
        <Text
          position={[12, labelHeight - 3, 0]}
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