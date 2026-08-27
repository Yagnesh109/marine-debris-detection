import React, { useEffect, useMemo, useState } from "react";
import MapComponent from "./MapComponent";
import SidePanel from "./SidePanel";
import "./MapPage.css";

function normalizeGeneratedPositions(rows) {
  return rows
    .map((row) => ({
      ...row,
      lat: Number(row.object_latitude),
      lng: Number(row.object_longitude),
      label: row.object_class,
    }))
    .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng));
}

/**
 * Convert AI detection results (from /api/detect/{image_id}) into points
 * that can be plotted on the Leaflet map.
 */
function normalizeDetectionPoints(objects = []) {
  return objects
    .map((object) => ({
      lat: Number(object.latitude),
      lng: Number(object.longitude),
      label: `${object.name} (${(object.confidence * 100).toFixed(1)}%)`,
      source: "detection",
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

export default function MapPage({ apiBaseUrl, refreshKey, detectionPoints }) {
  const [clickedCoords, setClickedCoords] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState([]);
  const [loadError, setLoadError] = useState("");

  // Two exclusive views:
  //   - detections present -> show ONLY the objects found in the uploaded image
  //   - otherwise          -> show the 100 dataset points (Calculate Position)
  const isDetectionView = normalizeDetectionPoints(detectionPoints).length > 0;

  const mappedPoints = useMemo(() => {
    if (isDetectionView) {
      return normalizeDetectionPoints(detectionPoints);
    }
    return normalizeGeneratedPositions(routeData);
  }, [routeData, detectionPoints, isDetectionView]);

  useEffect(() => {
    // Only load the 100 dataset points AFTER the user clicks "Calculate Position"
    // (refreshKey is incremented by that button in App.js).
    if (!refreshKey) {
      setRouteData([]);
      return;
    }

    const controller = new AbortController();

    const fetchGeneratedPositions = async () => {
      try {
        setLoadError("");
        const res = await fetch(`${apiBaseUrl}/api/geotag-calculated`, {
          signal: controller.signal,
        });

        if (res.status === 404) {
          setRouteData([]);
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load generated positions");
        }

        setRouteData(normalizeGeneratedPositions(data));
      } catch (err) {
        if (err.name !== "AbortError") {
          setLoadError(err.message);
          setRouteData([]);
        }
      }
    };

    fetchGeneratedPositions();

    return () => controller.abort();
  }, [apiBaseUrl, refreshKey]);

  useEffect(() => {
    if (!clickedCoords) return;

    const controller = new AbortController();
    setPlaceName("Finding place...");

    const fetchPlaceName = async () => {
      try {
        const query = new URLSearchParams({
          format: "jsonv2",
          lat: clickedCoords.lat,
          lon: clickedCoords.lng,
          zoom: "18",
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${query}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setPlaceName(data.display_name || "Place name unavailable");
      } catch (err) {
        if (err.name !== "AbortError") {
          setPlaceName("Place name unavailable");
        }
      }
    };

    fetchPlaceName();

    return () => controller.abort();
  }, [clickedCoords]);

  return (
    <div className="map-page-container">
      <div className="map-container">
        <MapComponent
          routeData={mappedPoints}
          pathColor="#FF5722"
          showMarkers={true}
          onMapClick={(coords) => setClickedCoords(coords)}
          onPointClick={(point) => {
            setClickedCoords({ lat: point.lat, lng: point.lng });
          }}
          onLocationFound={(loc) => setUserLocation(loc)}
        />
      </div>

      <div className="side-panel-container">
        <SidePanel
          coordinates={clickedCoords}
          placeName={placeName}
          userLocation={userLocation}
          routeInfo={{
            waypoints: mappedPoints.length,
            downloadUrl: `${apiBaseUrl}/api/download-geotag-calculated`,
          }}
        >
          {loadError && (
            <p style={{ margin: 0, color: "#ff7b72", fontSize: 13 }}>
              {loadError}
            </p>
          )}
        </SidePanel>
      </div>
    </div>
  );
}
