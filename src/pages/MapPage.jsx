import React, { useEffect, useState } from "react";
import MapComponent from "./MapComponent";
import SidePanel from "./SidePanel";
import ImageFind from "./ImageFind";
import routeData from "../data/solapurRoute.json";
import debrisImages from "../data/debrisImages.json";

export default function MapPage() {
  const [clickedCoords, setClickedCoords] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [userLocation, setUserLocation] = useState(null);

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
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 4, position: "relative", minHeight: 0 }}>
        <MapComponent
          routeData={routeData}
          pathColor="#FF5722"
          showMarkers={true}
          onMapClick={(coords) => setClickedCoords(coords)}
          onLocationFound={(loc) => setUserLocation(loc)}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <SidePanel
          coordinates={clickedCoords}
          placeName={placeName}
          userLocation={userLocation}
          routeInfo={{ waypoints: routeData.length }}
        >
          <ImageFind
            labels={debrisImages}
            columns={1}
            imageHeight={180}
            showSource={false}
          />
        </SidePanel>
      </div>
    </div>
  );
}
