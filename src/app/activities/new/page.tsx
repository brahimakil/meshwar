"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, Plus, X, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import MainLayout from "@/layouts/MainLayout";
import { activityService } from "@/services/activityService";
import { locationService } from "@/services/locationService";
import { Location } from "@/types/location";
import { ageGroupOptions } from "@/utils/ageGroupUtils";

// Dynamically import the ActivityMap to avoid SSR issues with Leaflet
const ActivityMap = dynamic(
  () => import("@/components/maps/ActivityMap"),
  { ssr: false }
);

// It's good practice to define these types at the top of the file or in a shared types file
// type DifficultyLevel = "easy" | "moderate" | "hard";
// Assuming ageGroupOptions are like: { value: string; label: string }[]
// type AgeGroupValue = string; // Or more specific if values are known: "child" | "teen" | "adult" etc.

export default function NewActivityPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "hard">("moderate");
  const [ageGroup, setAgeGroup] = useState<"all" | "adults" | "children" | "seniors">("all");
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [participantLimit, setParticipantLimit] = useState<number>(0);
  
  const router = useRouter();

  // Load available locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await locationService.getLocations();
        // Only show active locations
        setAvailableLocations(data.filter(loc => loc.isActive));
      } catch (err) {
        console.error("Error loading locations:", err);
        setError("Failed to load locations. Please try again.");
      }
    };
    
    loadLocations();
  }, []);

  // Update selected locations whenever selectedLocationIds changes
  useEffect(() => {
    const locations = availableLocations.filter(loc => 
      selectedLocationIds.includes(loc.id)
    );
    setSelectedLocations(locations);
  }, [selectedLocationIds, availableLocations]);

  // Calculate duration when start and end times change
  useEffect(() => {
    if (startTime && endTime) {
      // Parse times to calculate duration in minutes
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
      
      // Handle cases where end time is on the next day
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours in minutes
      }
      
      setEstimatedDuration(durationMinutes);
    }
  }, [startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Activity title is required");
      return;
    }

    if (!startDate) {
      setError("Start date is required");
      return;
    }

    if (!endDate) {
      setError("End date is required");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("End date cannot be before start date");
      return;
    }

    if (!startTime) {
      setError("Start time is required");
      return;
    }

    if (!endTime) {
      setError("End time is required");
      return;
    }

    if (selectedLocationIds.length === 0) {
      setError("Please select at least one location");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create activity
      await activityService.createActivity({
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        locations: selectedLocationIds,
        isActive,
        difficulty,
        ageGroup,
        estimatedDuration, // This is now automatically calculated
        estimatedCost,
        tags,
        participantLimit
      });
      
      router.push("/activities");
    } catch (err) {
      console.error("Error creating activity:", err);
      setError("Failed to create activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Get unique categories from selected locations
  const getUniqueCategories = () => {
    const categories = selectedLocations
      .map(loc => loc.category?.name)
      .filter(Boolean) as string[];
    
    return [...new Set(categories)];
  };

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
          <h1 className="text-3xl font-bold tracking-tight">New Activity</h1>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            
            {/* Date and Time */}
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-xl font-semibold">Date & Time</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                    Start Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                    End Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Locations */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Locations</h2>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              </div>
              
              {selectedLocations.length > 0 && (
                <div className="p-3 bg-muted/30 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">This activity contains:</span>{" "}
                    {getUniqueCategories().join(", ")}
                  </p>
                </div>
              )}
              
              {showMap && selectedLocations.length > 0 && (
                <div className="h-[400px] border rounded-md overflow-hidden">
                  <ActivityMap locations={selectedLocations} />
                </div>
              )}
              
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/50 p-3 border-b">
                  <h3 className="font-medium">Select Locations</h3>
                  <p className="text-xs text-muted-foreground">Select at least one location for this activity</p>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {availableLocations.length === 0 ? (
                    <p className="text-center p-4 text-muted-foreground">
                      No locations available. Please create locations first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableLocations.map(location => (
                        <div key={location.id} className="flex items-center p-2 hover:bg-muted/50 rounded-md">
                          <input
                            type="checkbox"
                            id={`location-${location.id}`}
                            checked={selectedLocationIds.includes(location.id)}
                            onChange={() => handleLocationToggle(location.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                          />
                          <div className="flex-1 min-w-0">
                            <label htmlFor={`location-${location.id}`} className="block font-medium cursor-pointer">
                              {location.name}
                            </label>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{location.address}</span>
                            </div>
                          </div>
                          {location.category && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {location.category.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-xl font-semibold">Additional Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "easy" | "moderate" | "hard")}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="ageGroup" className="block text-sm font-medium mb-1">
                    Age Group
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value as "all" | "adults" | "children" | "seniors")}
                    className="w-full p-2 border rounded-md"
                  >
                    {ageGroupOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="estimatedDuration" className="block text-sm font-medium mb-1">
                    Estimated Duration (calculated automatically)
                  </label>
                  <div className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                    {estimatedDuration} minutes
                    {estimatedDuration >= 60 && (
                      <span> ({Math.floor(estimatedDuration / 60)} hours {estimatedDuration % 60} minutes)</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="estimatedCost" className="block text-sm font-medium mb-1">
                    Estimated Cost
                  </label>
                  <input
                    id="estimatedCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-1">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags..."
                    className="flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <div key={tag} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Active Status */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Inactive activities won&apos;t be visible to users
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Participant Limit (0 for unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  value={participantLimit}
                  onChange={(e) => setParticipantLimit(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push("/activities")}
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Create Activity</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}