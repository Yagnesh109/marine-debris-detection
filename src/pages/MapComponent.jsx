import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet-polylinedecorator";
import "leaflet/dist/leaflet.css";
import "./MapComponent.css";

// Fix default marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom blue dot icon for user location
const userIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="width:24px;height:24px;border-radius:50%;background:rgba(66,133,244,0.2);position:absolute;top:0;left:0;"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:#4285F4;position:absolute;top:5px;left:5px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom numbered marker icon
const createNumberedIcon = (number, color = "#4285F4") =>
  new L.DivIcon({
    className: "",
    html: `
      <div style="width:26px;height:22px;border-radius:50%;background:${color};color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        ${number}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const mapViews = {
  satellite: {
    label: "Satellite",
    tileUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.arcgisonline.com/">ArcGIS</a>',
  },
};

const MapComponent = ({
  center = [12.9716, 77.5946],
  zoom = 12,
  onLocationFound,
  tileUrl = mapViews.satellite.tileUrl,
  attribution = mapViews.satellite.attribution,
  routeData = [], // Array of { lat, lng }
  pathColor = "#4285F4",
  pathWeight = 4,
  pathOpacity = 0.9,
  showMarkers = true,
  fitRouteBounds = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLayerGroupRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState(null);
  const [clickedPlaceName, setClickedPlaceName] = useState("");

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    tileLayerRef.current = L.tileLayer(tileUrl || mapViews.satellite.tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    const handleMapClick = (event) => {
      setClickedCoordinates({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    };

    mapInstanceRef.current.on("click", handleMapClick);

    return () => {
      mapInstanceRef.current?.off("click", handleMapClick);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!clickedCoordinates) return undefined;

    const controller = new AbortController();
    setClickedPlaceName("Finding place...");

    const fetchPlaceName = async () => {
      try {
        const query = new URLSearchParams({
          format: "jsonv2",
          lat: clickedCoordinates.lat,
          lon: clickedCoordinates.lng,
          zoom: "18",
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${query}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Reverse geocoding failed");

        const data = await response.json();
        setClickedPlaceName(data.display_name || "Place name unavailable");
      } catch (error) {
        if (error.name !== "AbortError") {
          setClickedPlaceName("Place name unavailable");
        }
      }
    };

    fetchPlaceName();

    return () => controller.abort();
  }, [clickedCoordinates]);

  // Draw route path when routeData changes
  useEffect(() => {
    if (!mapInstanceRef.current || !routeData || routeData.length < 2) return;

    // Remove previous route layers
    if (routeLayerGroupRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerGroupRef.current);
    }

    const group = L.layerGroup();

    // Build the polyline coordinates
    const latLngs = routeData.map((point) => [point.lat, point.lng]);

    // Draw the path line
    const polyline = L.polyline(latLngs, {
      color: pathColor,
      weight: pathWeight,
      opacity: pathOpacity,
      smoothFactor: 1,
      lineJoin: "round",
      lineCap: "round",
    }).addTo(group);

    // Add arrow decorations only when the plugin is available.
    if (L.polylineDecorator && L.Symbol?.arrowHead) {
      const decorator = L.polylineDecorator(polyline, {
        patterns: [
          {
            offset: "10%",
            repeat: "10%",
            symbol: L.Symbol.arrowHead({
              pixelSize: 8,
              pathOptions: {
                color: pathColor,
                fillOpacity: pathOpacity,
                weight: 2,
              },
            }),
          },
        ],
      });
      decorator.addTo(group);
    }

    // Add numbered markers at each point
    if (showMarkers) {
      routeData.forEach((point, index) => {
        L.marker([point.lat, point.lng], {
          icon: createNumberedIcon(index + 1),
        }).addTo(group);
      });
    }

    // Add start and end markers
    const startIcon = createNumberedIcon("S", "#27ae60");
    const endIcon = createNumberedIcon("E", "#e74c3c");

    const startPoint = routeData[0];
    const endPoint = routeData[routeData.length - 1];

    L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
      .addTo(group);

    if (routeData.length > 1) {
      L.marker([endPoint.lat, endPoint.lng], { icon: endIcon })
        .addTo(group);
    }

    group.addTo(mapInstanceRef.current);
    routeLayerGroupRef.current = group;

    // Fit map bounds to show entire route
    if (fitRouteBounds) {
      mapInstanceRef.current.fitBounds(polyline.getBounds(), {
        padding: [40, 40],
      });
    }
  }, [routeData, pathColor, pathWeight, pathOpacity, showMarkers, fitRouteBounds]);

  // Navigate to user's current location
  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = [latitude, longitude];

        if (mapInstanceRef.current) {
          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current);
          }

          mapInstanceRef.current.flyTo(userLocation, 16, {
            duration: 1.5,
          });

          userMarkerRef.current = L.marker(userLocation, {
            icon: userIcon,
          }).addTo(mapInstanceRef.current);

          if (onLocationFound) {
            onLocationFound({ lat: latitude, lng: longitude });
          }
        }

        setLocating(false);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Try again.");
            break;
          default:
            alert("Unknown error fetching location.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationFound]);

  return (
    <div className="map-component">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="map-container"
      />

      {/* Clicked Coordinates Display */}
      {clickedCoordinates && (
        <div
          className="map-coordinates"
        >
          Lat: {clickedCoordinates.lat.toFixed(6)}
          <br />
          Lng: {clickedCoordinates.lng.toFixed(6)}
          <br />
          {clickedPlaceName}
        </div>
      )}

      {/* Route Info Badge */}
      {routeData && routeData.length >= 2 && (
        <div
          className="route-info-badge"
        >
          <span style={{ color: pathColor }}>●</span> {routeData.length} waypoints
        </div>
      )}

      {/* My Location Button - Top Right Corner */}
      <button
        onClick={goToMyLocation}
        title="My Location"
        disabled={locating}
        className="my-location-button"
      >
        {locating ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="location-loader"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#999"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="31.4 31.4"
              strokeLinecap="round"
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="4" stroke="#666" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="9" stroke="#666" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="1.5" fill="#4285F4" />
          </svg>
        )}
      </button>

    </div>
  );
};

export default MapComponent;
