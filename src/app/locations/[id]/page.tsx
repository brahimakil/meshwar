"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, ArrowLeft, Loader2, AlertCircle, X, Plus, Map, ImageIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import MainLayout from "@/layouts/MainLayout";
import { locationService } from "@/services/locationService";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/category";
import { Location } from "@/types/location";
import { imageToBase64, resizeImage } from "@/utils/imageUtils";

// Dynamically import the LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
  () => import("@/components/maps/LocationPicker"),
  { ssr: false }
);

export default function EditLocationPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | string>("");
  const [lng, setLng] = useState<number | string>("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [icon, setIcon] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const categoriesData = await categoryService.getCategories();
        setCategories(categoriesData);
        
        // Load location
        const locationData = await locationService.getLocationById(id);
        if (!locationData) {
          setError("Location not found");
          setPageLoading(false);
          return;
        }
        
        setLocation(locationData);
        setName(locationData.name);
        setDescription(locationData.description || "");
        setAddress(locationData.address);
        setLat(locationData.coordinates.lat);
        setLng(locationData.coordinates.lng);
        setCategoryId(locationData.categoryId);
        setIcon(locationData.icon || null);
        setImages(locationData.images || []);
        setIsActive(locationData.isActive);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load location details. Please try again.");
      } finally {
        setPageLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const base64 = await imageToBase64(file);
      const resized = await resizeImage(base64, 200, 200); // Smaller size for icons
      
      setIcon(resized);
    } catch (err) {
      console.error("Error processing icon:", err);
      setError("Failed to process icon. Please try again.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const base64 = await imageToBase64(file);
      const resized = await resizeImage(base64);
      
      setImages([...images, resized]);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Failed to process image. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Location name is required");
      return;
    }

    if (!address.trim()) {
      setError("Address is required");
      return;
    }

    if (!lat || !lng) {
      setError("Coordinates are required");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update location
      await locationService.updateLocation(id, {
        name,
        description,
        address,
        coordinates: {
          lat: typeof lat === 'string' ? parseFloat(lat) : lat,
          lng: typeof lng === 'string' ? parseFloat(lng) : lng
        },
        categoryId,
        icon: icon || undefined,
        images,
        isActive,
      });
      
      router.push("/locations");
    } catch (err) {
      console.error("Error updating location:", err);
      setError("Failed to update location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!location && !pageLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold">Location not found</h2>
          <p className="text-muted-foreground mt-2">
            The location you&apos;re looking for doesn&apos;t exist or has been removed.
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Location</h1>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary h-32"
              />
            </div>
            
            {/* Icon Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Location Icon
              </label>
              <div className="flex items-center gap-4">
                {icon ? (
                  <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                    <Image
                      src={icon} 
                      alt="Location icon" 
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setIcon(null)}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-md border flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  <Plus className="h-4 w-4" />
                  <span>{icon ? "Change Icon" : "Upload Icon"}</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The icon will be used to represent this location on maps and lists.
              </p>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address <span className="text-destructive">*</span>
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary h-20"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Location <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Map className="h-3 w-3" />
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              </div>
              
              {showMap && (
                <div className="mb-4">
                  <LocationPicker 
                    initialLat={Number(lat)} 
                    initialLng={Number(lng)} 
                    onLocationSelect={handleLocationSelect} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Click on the map to select a location
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lat" className="block text-sm font-medium mb-1">
                    Latitude <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="lat"
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lng" className="block text-sm font-medium mb-1">
                    Longitude <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="lng"
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Images
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <Image
                        src={image} 
                        alt={`Location image ${index + 1}`} 
                        width={100}
                        height={100}
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-destructive/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <label className="border border-dashed rounded-md flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-muted/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Plus className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground text-center px-2">Add Image</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Images will be automatically resized and stored as base64 data.
                </p>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                />
                <span>Active</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push("/locations")}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}