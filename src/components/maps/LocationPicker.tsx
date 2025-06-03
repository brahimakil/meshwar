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
  initialLat = 25.276987,  // Default to center of Saudi Arabia
  initialLng = 45.086601,
  onLocationSelect 
}: LocationPickerProps) {
  // Ensure we have valid numbers for the initial position
  const safeInitialLat = typeof initialLat === 'number' && !isNaN(initialLat) ? initialLat : 
                        typeof initialLat === 'string' && !isNaN(parseFloat(initialLat)) ? parseFloat(initialLat) : 
                        25.276987;
                        
  const safeInitialLng = typeof initialLng === 'number' && !isNaN(initialLng) ? initialLng : 
                        typeof initialLng === 'string' && !isNaN(parseFloat(initialLng)) ? parseFloat(initialLng) : 
                        45.086601;
  
  const [position, setPosition] = useState<[number, number]>([safeInitialLat, safeInitialLng]);
  const [mapKey, setMapKey] = useState(Date.now()); // Used to force re-render when needed
  
  // Fix: Remove the dependency on position in this effect to prevent infinite loop
  useEffect(() => {
    // Only update if we have valid coordinates that are different from current position
    if (initialLat !== undefined && initialLng !== undefined) {
      const lat = typeof initialLat === 'number' && !isNaN(initialLat) ? initialLat : 
                typeof initialLat === 'string' && !isNaN(parseFloat(initialLat)) ? parseFloat(initialLat) : 
                safeInitialLat;
                
      const lng = typeof initialLng === 'number' && !isNaN(initialLng) ? initialLng : 
                typeof initialLng === 'string' && !isNaN(parseFloat(initialLng)) ? parseFloat(initialLng) : 
                safeInitialLng;
      
      // Only update if the coordinates are different from initial values
      if (Math.abs(lat - position[0]) > 0.000001 || Math.abs(lng - position[1]) > 0.000001) {
        setPosition([lat, lng]);
        setMapKey(Date.now()); // Force map re-render with new position
      }
    }
  }, [initialLat, initialLng]); // Remove position from dependencies
  
  // Update parent component when position changes
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