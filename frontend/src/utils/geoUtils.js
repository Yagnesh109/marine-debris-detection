/**
 * geoUtils.js
 * Utility for calculating geospatial positions for 3D map plotting.
 */

// Earth radius in meters
const EARTH_RADIUS = 6378137;

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
  // If some values are missing, provide clear DEMO values for development.
  const vehicleLat = data.vehicleLatitude ?? 15.35; // DEMO VALUE
  const vehicleLon = data.vehicleLongitude ?? 73.75; // DEMO VALUE
  const heading = data.vehicleHeading ?? 45; // DEMO VALUE
  const range = data.sonarRange ?? 50; // DEMO VALUE
  const azimuth = data.sonarAzimuth ?? 90; // DEMO VALUE
  const depth = data.depth ?? 35; // DEMO VALUE

  // Calculate global bearing
  const globalBearing = (heading + azimuth) % 360;
  const bearingRad = (globalBearing * Math.PI) / 180;

  const latRad = (vehicleLat * Math.PI) / 180;
  const lonRad = (vehicleLon * Math.PI) / 180;

  // Calculate new latitude and longitude
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(range / EARTH_RADIUS) +
    Math.cos(latRad) * Math.sin(range / EARTH_RADIUS) * Math.cos(bearingRad)
  );

  const newLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(range / EARTH_RADIUS) * Math.cos(latRad),
    Math.cos(range / EARTH_RADIUS) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  const finalLat = (newLatRad * 180) / Math.PI;
  const finalLon = (newLonRad * 180) / Math.PI;

  // Convert to local 3D coordinates for Three.js (simple flat projection around vehicle)
  // X = East, Z = North (in Three.js usually Y is up, Z is depth or similar)
  // We'll map: X = East, Y = Depth (negative), Z = North
  
  // Here we'll just return the relative offsets as x and z for a simple 3D map.
  const dx = range * Math.sin(bearingRad);
  const dz = range * Math.cos(bearingRad); // -dz if you want Z to be south

  return {
    latitude: finalLat,
    longitude: finalLon,
    depth: depth,
    // Local coordinates for 3D viewer relative to center
    x: dx,
    y: -depth,
    z: -dz // Negative because in Three.js Z points towards the camera (South)
  };
}
