import * as THREE from "three";

export function getTerrainY(x, z) {
  const y1 = Math.sin(x / 100) * 12 + Math.cos(z / 100) * 12;
  const y2 = Math.sin((x + z) / 50) * 5;
  return y1 + y2 - 40;
}

export function createTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position.array;
  for (let index = 0; index < positions.length; index += 3) {
    positions[index + 1] = getTerrainY(positions[index], positions[index + 2]);
  }
  geometry.computeVertexNormals();
  return geometry;
}