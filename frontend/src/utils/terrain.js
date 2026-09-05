import * as THREE from "three";

function terrainWave(x, z) {
  const y1 = Math.sin(x / 100) * 12 + Math.cos(z / 100) * 12;
  const y2 = Math.sin((x + z) / 50) * 5;
  return y1 + y2;
}

export function getTerrainY(x, z, anchorX, anchorZ, anchorDepth) {
  const anchorWave = terrainWave(anchorX, anchorZ);
  const relativeWave = (terrainWave(x, z) - anchorWave) * 0.35;
  return Math.min(-0.5, -anchorDepth + relativeWave);
}

export function createTerrainGeometry(anchorX, anchorZ, anchorDepth) {
  const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position.array;
  for (let index = 0; index < positions.length; index += 3) {
    positions[index + 1] = getTerrainY(
      positions[index],
      positions[index + 2],
      anchorX,
      anchorZ,
      anchorDepth,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}