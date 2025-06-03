"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Edit, Trash2, AlertCircle, ImageIcon } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { locationService } from "@/services/locationService";
import { Location } from "@/types/location";

export default function ViewLocationPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const data = await locationService.getLocationById(id);
        if (!data) {
          setError("Location not found");
          return;
        }
        
        setLocation(data);
      } catch (err) {
        console.error("Error loading location:", err);
        setError("Failed to load location details");
      } finally {
        setLoading(false);
      }
    };
    
    loadLocation();
  }, [id]);

  const handleDeleteLocation = async () => {
    if (!window.confirm("Are you sure you want to delete this location?")) {
      return;
    }
    
    try {
      await locationService.deleteLocation(id);
      router.push("/locations");
    } catch (err) {
      console.error("Error deleting location:", err);
      setError("Failed to delete location. Please try again.");
    }
  };

  const openInGoogleMaps = () => {
    if (location?.coordinates) {
      const { lat, lng } = location.coordinates;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!location && !loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold">Location not found</h2>
          <p className="text-muted-foreground mt-2">
            The location you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/locations")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Back to Locations
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              {location?.icon ? (
                <img 
                  src={location.icon} 
                  alt={`${location.name} icon`} 
                  className="h-10 w-10 rounded-md object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
              )}
              <h1 className="text-3xl font-bold tracking-tight">{location?.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={openInGoogleMaps}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              title="Open in Google Maps"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Open in Maps</span>
            </button>
            <button
              onClick={() => router.push(`/locations/${id}`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={handleDeleteLocation}
              className="flex items-center gap-2 px-3 py-1.5 text-destructive rounded-md hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            {location?.images && location.images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-80 rounded-lg overflow-hidden border">
                  <img 
                    src={location.images[currentImageIndex]} 
                    alt={`${location.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {location.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {location.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-16 w-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                          index === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-80 rounded-lg border flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No images available</p>
                </div>
              </div>
            )}
            
            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">About this location</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {location?.description || "No description available."}
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Status badge */}
            <div className="flex justify-between items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                location?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {location?.isActive ? "Active" : "Inactive"}
              </span>
              
              {location?.category && (
                <span className="inline-block bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs">
                  {location.category.name}
                </span>
              )}
            </div>
            
            {/* Location details */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Location Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{location?.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Added on</p>
                    <p className="text-sm text-muted-foreground">
                      {location?.createdAt instanceof Date 
                        ? location.createdAt.toLocaleDateString() 
                        : new Date(location?.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={openInGoogleMaps}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 mt-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Open in Google Maps</span>
                </button>
              </div>
            </div>
            
            {/* Coordinates */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Coordinates</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="font-mono text-sm">{location?.coordinates.lat}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="font-mono text-sm">{location?.coordinates.lng}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 