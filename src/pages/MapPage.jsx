import React, { useEffect, useState } from "react";
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

export default function MapPage({ apiBaseUrl, refreshKey }) {
  const [clickedCoords, setClickedCoords] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
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
          routeData={routeData}
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
            waypoints: routeData.length,
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
