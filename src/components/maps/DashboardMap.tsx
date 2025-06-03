'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/types/location';

// Fix Leaflet icon issue in Next.js
const fixLeafletIcons = () => {
  // Only run on client-side
  if (typeof window !== 'undefined') {
    // Delete the default icon
    delete L.Icon.Default.prototype._getIconUrl;
    
    // Set default icon paths
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png',
    });
  }
};

interface DashboardMapProps {
  locations: Location[];
}

export default function DashboardMap({ locations }: DashboardMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.276987, 45.086601]); // Default to center of Saudi Arabia
  const [mapZoom, setMapZoom] = useState(6);
  
  // Calculate map center and zoom based on locations
  useEffect(() => {
    if (locations.length === 0) return;

    // Calculate bounds to fit all markers
    const lats = locations.map(loc => loc.coordinates.lat);
    const lngs = locations.map(loc => loc.coordinates.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    setMapCenter([centerLat, centerLng]);
    
    // If only one location, set a default zoom
    if (locations.length === 1) {
      setMapZoom(13);
    } else {
      // Calculate appropriate zoom level based on the geographical spread
      setMapZoom(6);
    }
  }, [locations]);

  // Create custom icon for each location
  const createLocationIcon = (location: Location) => {
    // Use the location's icon if available
    if (location.icon) {
      return new Icon({
        iconUrl: location.icon,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    }
    
    // Otherwise use a default blue icon
    return new Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Add markers for each location */}
      {locations.map((location) => (
        <Marker 
          key={location.id} 
          position={[location.coordinates.lat, location.coordinates.lng]}
          icon={createLocationIcon(location)}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-medium">{location.name}</h3>
              <p className="text-xs text-muted-foreground">{location.address}</p>
              {location.category && (
                <span className="inline-block mt-1 text-xs bg-muted px-2 py-1 rounded-full">
                  {location.category.name}
                </span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 