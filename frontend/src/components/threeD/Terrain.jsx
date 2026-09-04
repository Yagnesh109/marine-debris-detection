import { useMemo } from "react";
import * as THREE from "three";
import { createTerrainGeometry } from "../../utils/terrain";

export default function Terrain() {
  const geometry = useMemo(createTerrainGeometry, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.1,
  }), []);

  const coloredGeometry = useMemo(() => {
    const colored = geometry.clone();
    const positions = colored.attributes.position.array;
    const colors = new Float32Array(positions.length);
    const color = new THREE.Color();
    const shallow = new THREE.Color("#00aaff");
    const medium = new THREE.Color("#0055aa");
    const deep = new THREE.Color("#001144");

    for (let index = 0; index < positions.length; index += 3) {
      const normalizedHeight = Math.max(0, Math.min(1, (positions[index + 1] + 60) / 40));
      const midpoint = normalizedHeight > 0.5;
      color.lerpColors(
        midpoint ? medium : deep,
        midpoint ? shallow : medium,
        midpoint ? (normalizedHeight - 0.5) * 2 : normalizedHeight * 2
      );
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }
    colored.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return colored;
  }, [geometry]);

  return (
    <group>
      <mesh geometry={coloredGeometry} material={material} receiveShadow />
      <mesh geometry={coloredGeometry}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}