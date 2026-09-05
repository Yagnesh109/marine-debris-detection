/**
 * geoUtils.js
 * Utility for calculating geospatial positions for 3D map plotting.
 */

/**
 * Calculates the object's geographic position relative to the vehicle.
 * 
 * @param {Object} data - The detection data and telemetry
 * @param {number} data.vehicleLatitude - Vehicle's latitude in degrees
 * @param {number} data.vehicleLongitude - Vehicle's longitude in degrees
 * @param {number} data.vehicleHeading - Vehicle's heading in degrees (0 is North, clockwise)
 * @param {number} data.sonarRange - Distance to the object in meters
 * @param {number} data.sonarAzimuth - Angle of the object relative to the vehicle's heading in degrees
 * @param {number} data.depth - Depth of the object in meters
 * 
 * @returns {Object} { latitude, longitude, depth, x, y, z }
 */
export function calculateObjectGeoPosition(data) {
  const range = Number(data.sonarRange);
  const azimuth = Number(data.sonarAzimuth);
  const depth = Number(data.depth);
  if (![range, azimuth, depth].every(Number.isFinite)) {
    throw new Error("XML sonar geometry is required to display a 3D detection.");
  }

  // Calculate global bearing
  const globalBearing = azimuth % 360;
  const bearingRad = (globalBearing * Math.PI) / 180;

  // Convert to local 3D coordinates for Three.js (simple flat projection around vehicle)
  // X = East, Z = North (in Three.js usually Y is up, Z is depth or similar)
  // We'll map: X = East, Y = Depth (negative), Z = North
  
  // Here we'll just return the relative offsets as x and z for a simple 3D map.
  const dx = Number.isFinite(data.localX) ? data.localX : range * Math.sin(bearingRad);
  const dz = Number.isFinite(data.localZ) ? data.localZ : -range * Math.cos(bearingRad);

  return {
    latitude: data.vehicleLatitude ?? null,
    longitude: data.vehicleLongitude ?? null,
    depth: depth,
    // Local coordinates for 3D viewer relative to center
    x: dx,
    y: -depth,
    z: -dz // Negative because in Three.js Z points towards the camera (South)
  };
}
