"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, AlertCircle, Calendar, Eye, Clock } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Activity } from "@/types/activity";
import { activityService } from "@/services/activityService";
import { formatDate } from "@/utils/dateUtils";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    console.log("[TEST] Testing activityService directly");
    activityService.getActivities()
      .then(activities => {
        console.log("[SUCCESS] Activities loaded:", activities.length);
      })
      .catch(error => {
        console.error("[FAILED] Activity loading failed:", error);
      });
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getActivities();
      setActivities(data);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError("Failed to load activities. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      await activityService.toggleActivityStatus(id, !currentStatus);
      
      // Update the local state
      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === id ? { ...activity, isActive: !currentStatus } : activity
        )
      );
    } catch (err) {
      console.error("Error toggling activity status:", err);
      setError("Failed to update activity status. Please try again.");
    }
  }

  async function handleDeleteActivity(id: string) {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }
    
    try {
      await activityService.deleteActivity(id);
      
      // Remove from local state
      setActivities(prevActivities => 
        prevActivities.filter(activity => activity.id !== id)
      );
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError("Failed to delete activity. Please try again.");
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">
              Manage activities and their locations
            </p>
          </div>
          
          <button
            onClick={() => router.push("/activities/new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Create Activity</span>
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
        ) : activities.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card">
            <p className="text-muted-foreground">No activities found. Create your first activity!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded-lg overflow-hidden bg-card">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold">{activity.title}</h2>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.isExpired 
                          ? "bg-gray-100 text-gray-800" 
                          : activity.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                      }`}>
                        {activity.isExpired 
                          ? "Expired" 
                          : activity.isActive 
                            ? "Active" 
                            : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {activity.description}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDate(activity.startDate)} - {formatDate(activity.endDate)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{activity.startTime} - {activity.endTime}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Locations:</span> {activity.locations.length}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Difficulty:</span> {activity.difficulty}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Participants:</span> {activity.currentParticipants || 0}/{activity.participantLimit || "∞"}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/activities/view/${activity.id}`)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/activities/${activity.id}`)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-1 hover:bg-background rounded text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {!activity.isExpired && (
                    <button
                      onClick={() => handleToggleStatus(activity.id, activity.isActive)}
                      className={`text-xs px-3 py-1 rounded-md ${
                        activity.isActive 
                          ? "bg-red-100 text-red-800 hover:bg-red-200" 
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {activity.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 