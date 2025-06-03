"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Custom marker component to handle map clicks
function MapMarker({ position, setPosition }: { 
  position: [number, number]; 
  setPosition: (pos: [number, number]) => void;
}) {
  // Create a custom blue marker icon
  const blueIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Set up map click handler
  useMapEvents({
    click: (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} icon={blueIcon} />;
}

export default function LocationPicker({ 
  initialLat, 
  initialLng,
  onLocationSelect 
}: LocationPickerProps) {
  const defaultLat = 25.276987;
  const defaultLng = 45.086601;

  const getSafeCoord = (coord: number | string | undefined, defaultVal: number): number => {
    if (typeof coord === 'number' && !isNaN(coord)) return coord;
    if (typeof coord === 'string' && !isNaN(parseFloat(coord))) return parseFloat(coord);
    return defaultVal;
  };
  
  const safeInitialLat = getSafeCoord(initialLat, defaultLat);
  const safeInitialLng = getSafeCoord(initialLng, defaultLng);
  
  const [position, setPosition] = useState<[number, number]>([safeInitialLat, safeInitialLng]);
  const [mapKey, setMapKey] = useState(Date.now()); 
  
  useEffect(() => {
    if (Math.abs(safeInitialLat - position[0]) > 0.000001 || Math.abs(safeInitialLng - position[1]) > 0.000001) {
      setPosition([safeInitialLat, safeInitialLng]);
    }
  }, [position, safeInitialLat, safeInitialLng]);

  useEffect(() => {
    setMapKey(Date.now());
  }, [safeInitialLat, safeInitialLng]);

  const handlePositionChange = (newPosition: [number, number]) => {
    setPosition(newPosition);
    onLocationSelect(newPosition[0], newPosition[1]);
  };

  return (
    <div className="h-[400px] w-full rounded-md overflow-hidden border">
      <MapContainer 
        key={mapKey} 
        center={position} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarker position={position} setPosition={handlePositionChange} />
      </MapContainer>
    </div>
  );
} 