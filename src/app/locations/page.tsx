"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, AlertCircle, MapPin, Eye, ImageIcon } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Location } from "@/types/location";
import { locationService } from "@/services/locationService";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      setLoading(true);
      setError(null);
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (err) {
      console.error("Error loading locations:", err);
      setError("Failed to load locations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      await locationService.toggleLocationStatus(id, !currentStatus);
      
      // Update the local state
      setLocations(prevLocations =>
        prevLocations.map(location =>
          location.id === id ? { ...location, isActive: !currentStatus } : location
        )
      );
    } catch (err) {
      console.error("Error toggling location status:", err);
      setError("Failed to update location status. Please try again.");
    }
  }

  async function handleDeleteLocation(id: string) {
    if (!window.confirm("Are you sure you want to delete this location?")) {
      return;
    }
    
    try {
      await locationService.deleteLocation(id);
      
      // Remove from local state
      setLocations(prevLocations => 
        prevLocations.filter(location => location.id !== id)
      );
    } catch (err) {
      console.error("Error deleting location:", err);
      setError("Failed to delete location. Please try again.");
    }
  }

  function openInGoogleMaps(location: Location) {
    if (location.coordinates) {
      const { lat, lng } = location.coordinates;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
            <p className="text-muted-foreground">
              Manage your locations
            </p>
          </div>
          
          <button
            onClick={() => router.push("/locations/new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Add Location</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card">
            <p className="text-muted-foreground">No locations found. Create your first location!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div key={location.id} className="border rounded-lg overflow-hidden bg-card">
                <div className="relative h-48 overflow-hidden">
                  {location.images && location.images.length > 0 ? (
                    <img 
                      src={location.images[0]} 
                      alt={location.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-0 right-0 p-2 bg-background/80 rounded-bl-lg">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      location.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {location.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{location.name}</h3>
                  
                  {location.category && (
                    <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-xs mb-2">
                      {location.category.name}
                    </span>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {location.description || "No description"}
                  </p>
                  
                  <p className="text-sm mb-4 flex items-start gap-1">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{location.address}</span>
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <button
                        onClick={() => handleToggleStatus(location.id, location.isActive)}
                        className="text-xs text-muted-foreground hover:text-foreground mr-2"
                      >
                        {location.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openInGoogleMaps(location)}
                        className="p-2 hover:bg-primary/10 rounded-md text-primary"
                        title="Open in Google Maps"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/locations/${location.id}`)}
                        className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 