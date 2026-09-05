import React, { useCallback, useEffect, useMemo, useState } from "react";
import MapComponent from "./MapComponent";
import SidePanel from "./SidePanel";
import "./MapPage.css";
import { normalizeDetectionPoints, normalizeGeneratedPositions } from "../utils/mapPoints";

export default function MapPage({ apiBaseUrl, refreshKey, detectionPoints }) {
  const [clickedCoords, setClickedCoords] = useState(null);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const primaryDetection = useMemo(() => {
    return detectionPoints.reduce((highest, detection) => {
      if (!highest) return detection;
      return (Number(detection.confidence) || 0) > (Number(highest.confidence) || 0)
        ? detection
        : highest;
    }, null);
  }, [detectionPoints]);

  // Two exclusive views:
  //   - detections present -> show ONLY the objects found in the uploaded image
  //   - otherwise          -> show no generated dataset points
  const isDetectionView = normalizeDetectionPoints(detectionPoints).length > 0;

  const mappedPoints = useMemo(() => {
    if (isDetectionView) {
      return normalizeDetectionPoints(primaryDetection ? [primaryDetection] : []);
    }
    return normalizeGeneratedPositions(routeData);
  }, [routeData, primaryDetection, isDetectionView]);

  const handleMapClick = useCallback((coords) => {
    setSelectedDetection(null);
    setClickedCoords(coords);
  }, []);

  const handlePointClick = useCallback((point) => {
    setSelectedDetection(point);
    setClickedCoords({ lat: point.lat, lng: point.lng });
  }, []);

  useEffect(() => {
    // Generated dataset positions remain available for the existing map flow,
    // but are not loaded unless a caller supplies a refresh key.
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
          onMapClick={handleMapClick}
          onPointClick={handlePointClick}
          onLocationFound={(loc) => setUserLocation(loc)}
        />
      </div>

      <div className="side-panel-container">
        <SidePanel
          coordinates={clickedCoords}
          detection={selectedDetection}
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
