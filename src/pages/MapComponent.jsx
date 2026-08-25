/**
 * MapComponent.jsx
 * 
 * Leaflet satellite map with route drawing, numbered markers,
 * arrow decorations, and GPS location button.
 * 
 * All click/location data is sent UP to the parent via callbacks —
 * no overlays or reverse-geocoding inside this component.
 */

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

const createDotIcon = (color = "#e11d48", size = 10) =>
  new L.DivIcon({
    className: "",
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.45);"></div>
    `,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
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
  onMapClick,
  onPointClick,
  tileUrl = mapViews.satellite.tileUrl,
  attribution = mapViews.satellite.attribution,
  routeData = [],
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
      if (onMapClick) {
        onMapClick({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        });
      }
    };

    mapInstanceRef.current.on("click", handleMapClick);

    return () => {
      mapInstanceRef.current?.off("click", handleMapClick);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw route path when routeData changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeLayerGroupRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerGroupRef.current);
      routeLayerGroupRef.current = null;
    }

    if (!routeData || routeData.length < 2) return;

    const group = L.layerGroup();
    const latLngs = routeData.map((point) => [point.lat, point.lng]);

    const polyline = L.polyline(latLngs, {
      color: pathColor,
      weight: pathWeight,
      opacity: pathOpacity,
      smoothFactor: 1,
      lineJoin: "round",
      lineCap: "round",
    }).addTo(group);

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

    if (showMarkers) {
      routeData.forEach((point, index) => {
        const isStart = index === 0;
        const isEnd = index === routeData.length - 1;
        const markerColor = isStart ? "#16a34a" : isEnd ? "#111827" : "#dc2626";
        const markerSize = isStart || isEnd ? 12 : 8;
        const marker = L.marker([point.lat, point.lng], {
          icon: createDotIcon(markerColor, markerSize),
        });

        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (onPointClick) {
            onPointClick(point);
          }
        });

        marker.addTo(group);
      });
    }

    group.addTo(mapInstanceRef.current);
    routeLayerGroupRef.current = group;

    if (fitRouteBounds) {
      mapInstanceRef.current.fitBounds(polyline.getBounds(), {
        padding: [40, 40],
      });
    }
  }, [routeData, pathColor, pathWeight, pathOpacity, showMarkers, fitRouteBounds, onPointClick]);

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

          mapInstanceRef.current.flyTo(userLocation, 16, { duration: 1.5 });

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
      <div ref={mapContainerRef} className="map-container" />

      {/* Route Info Badge */}
      {routeData && routeData.length >= 2 && (
        <div className="route-info-badge">
          <span style={{ color: pathColor }}>●</span> {routeData.length} waypoints
        </div>
      )}

      {/* My Location Button — Top Right Corner */}
      <button
        onClick={goToMyLocation}
        title="My Location"
        disabled={locating}
        className="my-location-button"
      >
        {locating ? (
          <svg width="20" height="20" viewBox="0 0 24 24" className="location-loader">
            <circle cx="12" cy="12" r="10" stroke="#999" strokeWidth="2.5" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
