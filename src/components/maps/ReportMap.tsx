"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngExpression, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Location } from "@/types/location";
import { Activity } from "@/types/activity";
import { formatDate } from "@/utils/dateUtils";

interface ReportMapProps {
  locations: Location[];
  activities?: Activity[];
}

// Fix Leaflet icon issues in Next.js
function fixLeafletIcons() {
  // Only fix in client environment
  if (typeof window !== "undefined") {
    // Fix marker icon
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    });
  }
}

// Map adjusts bounds to fit all markers
function MapBoundsFitter({ locations }: { locations: Location[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length === 0) return;
    
    const bounds = new LatLngBounds([]);
    
    locations.forEach(location => {
      if (location.coordinates && typeof location.coordinates.lat === 'number' && typeof location.coordinates.lng === 'number') {
        bounds.extend([location.coordinates.lat, location.coordinates.lng]);
      }
    });
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

export default function ReportMap({ locations, activities }: ReportMapProps) {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([25.276987, 45.086601]); // Default to center of Saudi Arabia
  
  // Fix icon issues
  useEffect(() => {
    fixLeafletIcons();
  }, []);
  
  // Calculate map center
  useEffect(() => {
    if (locations.length === 0) return;
    
    // Calculate center of all locations
    const totalLocations = locations.length;
    const sumLat = locations.reduce((sum, loc) => sum + (loc.coordinates?.lat || 0), 0);
    const sumLng = locations.reduce((sum, loc) => sum + (loc.coordinates?.lng || 0), 0);
    
    const centerLat = sumLat / totalLocations;
    const centerLng = sumLng / totalLocations;
    
    setMapCenter([centerLat, centerLng]);
  }, [locations]);
  
  // Create custom icon for each location
  const createLocationIcon = (location: Location) => {
    if (location.icon) {
      return new Icon({
        iconUrl: location.icon,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    }
    
    const categoryColors: Record<string, string> = {
      park: 'green',
      museum: 'orange',
      restaurant: 'red',
      hotel: 'blue',
      beach: 'yellow',
      mountain: 'purple',
      historic: 'brown',
    };
    let color = 'blue'; // Default color
    
    if (location.category && location.category.name && typeof location.category.name === 'string') {
      const lowerCaseCategoryName = location.category.name.toLowerCase();
      if (categoryColors[lowerCaseCategoryName]) {
        color = categoryColors[lowerCaseCategoryName];
      }
    }
    
    return new Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };
  
  // Get activities for a location
  const getActivitiesForLocation = (locationId: string) => {
    if (!activities) return [];
    return activities.filter(activity => 
      activity.locations && activity.locations.includes(locationId)
    );
  };
  
  return (
    <MapContainer 
      center={mapCenter} 
      zoom={6} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapBoundsFitter locations={locations} />
      
      {locations.map(location => (
        <Marker 
          key={location.id} 
          position={[location.coordinates.lat, location.coordinates.lng]}
          icon={createLocationIcon(location)}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-medium text-lg">{location.name}</h3>
              <p className="text-sm text-muted-foreground">{location.address || "No address provided"}</p>
              
              {typeof location.category === 'string' ? (
                <p className="text-sm mt-1">
                  <span className="font-medium">Category:</span> {location.category}
                </p>
              ) : location.category && typeof location.category === 'object' ? (
                <p className="text-sm mt-1">
                  <span className="font-medium">Category:</span> {
                    location.category.name || "Unknown Category"
                  }
                </p>
              ) : (
                <p className="text-sm mt-1">
                  <span className="font-medium">Category:</span> Uncategorized
                </p>
              )}
              
              {activities && (
                <div className="mt-2">
                  <p className="text-sm font-medium">
                    Activities: {getActivitiesForLocation(location.id).length}
                  </p>
                  
                  {getActivitiesForLocation(location.id).length > 0 && (
                    <ul className="text-xs mt-1 space-y-1">
                      {getActivitiesForLocation(location.id).slice(0, 3).map(activity => (
                        <li key={activity.id}>
                          • {activity.title} ({formatDate(activity.startDate)})
                        </li>
                      ))}
                      {getActivitiesForLocation(location.id).length > 3 && (
                        <li>• ...and {getActivitiesForLocation(location.id).length - 3} more</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 