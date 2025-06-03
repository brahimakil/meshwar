"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Tag, Users, Dumbbell, DollarSign, Edit, Trash2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import MainLayout from "@/layouts/MainLayout";
import { activityService } from "@/services/activityService";
import { Activity } from "@/types/activity";
import { formatDate } from "@/utils/dateUtils";

// Dynamically import the ActivityMap to avoid SSR issues with Leaflet
const ActivityMap = dynamic(
  () => import("@/components/maps/ActivityMap"),
  { ssr: false }
);

export default function ViewActivityPage() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const data = await activityService.getActivityById(id);
        if (!data) {
          setError("Activity not found");
          return;
        }
        
        setActivity(data);
      } catch (err) {
        console.error("Error loading activity:", err);
        setError("Failed to load activity details");
      } finally {
        setLoading(false);
      }
    };
    
    loadActivity();
  }, [id]);

  const handleDeleteActivity = async () => {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }
    
    try {
      await activityService.deleteActivity(id);
      router.push("/activities");
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError("Failed to delete activity. Please try again.");
    }
  };

  // Get unique categories from activity locations
  const getUniqueCategories = () => {
    if (!activity?.locationObjects) return [];
    
    const categories = activity.locationObjects
      .map(loc => loc.category?.name)
      .filter(Boolean) as string[];
    
    return [...new Set(categories)];
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

  if (!activity && !loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold">Activity not found</h2>
          <p className="text-muted-foreground mt-2">
            The activity you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/activities")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Back to Activities
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{activity?.title}</h1>
            <div className="flex gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                activity?.isExpired 
                  ? "bg-gray-100 text-gray-800" 
                  : activity?.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
              }`}>
                {activity?.isExpired 
                  ? "Expired" 
                  : activity?.isActive 
                    ? "Active" 
                    : "Inactive"}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                activity?.difficulty === "easy" 
                  ? "bg-green-100 text-green-800" 
                  : activity?.difficulty === "moderate"
                    ? "bg-yellow-100 text-yellow-800" 
                    : "bg-red-100 text-red-800"
              }`}>
                {activity?.difficulty.charAt(0).toUpperCase() + activity?.difficulty.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {activity?.description && (
              <div className="border rounded-lg p-4 bg-card">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-line">{activity.description}</p>
              </div>
            )}
            
            {/* Map */}
            {activity?.locationObjects && activity.locationObjects.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b bg-card">
                  <h2 className="text-xl font-semibold">Locations</h2>
                  <p className="text-sm text-muted-foreground">
                    This activity includes {activity.locationObjects.length} location{activity.locationObjects.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-[400px]">
                  <ActivityMap locations={activity.locationObjects} />
                </div>
              </div>
            )}
            
            {/* Location List */}
            {activity?.locationObjects && activity.locationObjects.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b bg-card">
                  <h2 className="text-xl font-semibold">Location Details</h2>
                </div>
                <div className="divide-y">
                  {activity.locationObjects.map((location, index) => (
                    <div key={location.id} className="p-4 bg-card">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 text-primary">
                          <span className="font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{location.name}</h3>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                          {location.category && (
                            <span className="inline-block mt-1 text-xs bg-muted px-2 py-1 rounded-full">
                              {location.category.name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/locations/view/${location.id}`)}
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Activity Details */}
            <div className="border rounded-lg p-4 bg-card">
              <h2 className="text-xl font-semibold mb-4">Activity Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(activity?.startDate)} - {formatDate(activity?.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {activity?.startTime} - {activity?.endTime}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Age Group</p>
                    <p className="text-sm text-muted-foreground">
                      {activity?.ageGroup === "all" ? "All Ages" : 
                       activity?.ageGroup === "adults" ? "Adults" :
                       activity?.ageGroup === "children" ? "Children" : "Seniors"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Difficulty</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {activity?.difficulty}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {activity?.estimatedDuration} minutes
                      {activity?.estimatedDuration >= 60 && (
                        <span> ({Math.floor(activity.estimatedDuration / 60)} hours {activity.estimatedDuration % 60} minutes)</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Estimated Cost</p>
                    <p className="text-sm text-muted-foreground">
                      {activity?.estimatedCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Participants</p>
                    <p className="text-sm text-muted-foreground">
                      {activity?.currentParticipants || 0}/{activity?.participantLimit || "∞"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Categories */}
            {getUniqueCategories().length > 0 && (
              <div className="border rounded-lg p-4 bg-card">
                <h2 className="text-lg font-semibold mb-2">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {getUniqueCategories().map(category => (
                    <span key={category} className="bg-muted px-2 py-1 rounded-full text-xs">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {activity?.tags && activity.tags.length > 0 && (
              <div className="border rounded-lg p-4 bg-card">
                <h2 className="text-lg font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {activity.tags.map(tag => (
                    <span key={tag} className="bg-muted px-2 py-1 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="border rounded-lg p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/activities/${id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Activity</span>
                </button>
                
                <button
                  onClick={handleDeleteActivity}
                  className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-2 px-4 rounded-md hover:bg-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Activity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 