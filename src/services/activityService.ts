import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity } from "@/types/activity";
import { locationService } from "./locationService";
import { safeToDate } from "@/utils/dateUtils";

const activitiesCollection = collection(db, "activities");

export const activityService = {
  // Get all activities
  async getActivities(): Promise<Activity[]> {
    try {
      console.log("[DEBUG] Starting activityService.getActivities");
      const q = query(activitiesCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      console.log(`[DEBUG] Retrieved ${snapshot.docs.length} activities`);
      
      const activities: Activity[] = [];
      
      for (const docSnap of snapshot.docs) {
        try {
          console.log(`[DEBUG] Processing document: ${docSnap.id}`);
          
          // Enhanced validation for document snapshot
          if (!docSnap.exists()) {
            console.warn(`[WARNING] Document ${docSnap.id} does not exist`);
            continue;
          }
          
          const data = docSnap.data();
          if (!data) {
            console.warn(`[WARNING] No data for document ${docSnap.id}`);
            continue;
          }
          
          console.log(`[DEBUG] Raw data for ${docSnap.id}:`, data);
          
          const activity: Activity = {
            id: docSnap.id,
            title: data.title ?? '',
            description: data.description || '',
            startDate: safeToDate(data.startDate),
            endDate: safeToDate(data.endDate),
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            locations: data.locations || [],
            isActive: data.isActive !== undefined ? data.isActive : true,
            isExpired: data.isExpired || false,
            difficulty: data.difficulty || 'easy',
            ageGroup: data.ageGroup || 'all',
            estimatedDuration: data.estimatedDuration || 0,
            estimatedCost: data.estimatedCost || 0,
            tags: data.tags || [],
            participantLimit: data.participantLimit || 0,
            currentParticipants: data.currentParticipants || 0,
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
          };
          
          console.log(`[DEBUG] Converted activity ${docSnap.id}:`, activity);
          activities.push(activity);
        } catch (docError) {
          console.error(`[ERROR] Error processing document ${docSnap.id}:`, docError);
        }
      }
      
      console.log(`[DEBUG] Successfully processed ${activities.length} activities`);
      
      // Check if activities are expired
      const now = new Date();
      for (const activity of activities) {
        if (activity.endDate && activity.endDate < now && !activity.isExpired) {
          activity.isExpired = true;
          try {
            await this.updateActivity(activity.id, { isExpired: true });
          } catch (error) {
            console.error("Error updating expired status:", error);
          }
        }
      }
      
      return activities;
    } catch (error) {
      console.error("[CRITICAL] Error in getActivities:", error);
      throw new Error(`Failed to fetch activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Get a single activity by ID
  async getActivityById(id: string): Promise<Activity | null> {
    try {
      const docRef = doc(activitiesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap || !docSnap.exists()) {
        console.warn(`[WARNING] Activity document ${id} does not exist`);
        return null;
      }
      
      // Enhanced validation for document snapshot
      if (typeof docSnap.data !== 'function') {
        console.error(`[CRITICAL] docSnap.data is not a function for ${id}:`, {
          type: typeof docSnap.data,
          docSnap: docSnap,
          hasData: 'data' in docSnap
        });
        return null;
      }
      
      let data;
      try {
        data = docSnap.data();
      } catch (dataError) {
        console.error(`[CRITICAL] Error calling docSnap.data() for ${id}:`, dataError);
        return null;
      }
      
      if (!data) {
        console.warn(`[WARNING] No data returned for activity ${id}`);
        return null;
      }
      
      const activity: Activity = {
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        locations: data.locations || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        isExpired: data.isExpired || false,
        difficulty: data.difficulty || 'easy',
        ageGroup: data.ageGroup || 'all',
        estimatedDuration: data.estimatedDuration || 0,
        estimatedCost: data.estimatedCost || 0,
        tags: data.tags || [],
        participantLimit: data.participantLimit || 0,
        currentParticipants: data.currentParticipants || 0,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      };
      
      // Check if activity is expired
      const now = new Date();
      if (activity.endDate && activity.endDate < now && !activity.isExpired) {
        activity.isExpired = true;
        try {
          await this.updateActivity(activity.id, { isExpired: true });
        } catch (error) {
          console.error("Error updating expired status:", error);
        }
      }
      
      // Fetch location objects
      if (activity.locations && activity.locations.length > 0) {
        try {
          const locationPromises = activity.locations.map(locationId => 
            locationService.getLocationById(locationId)
          );
          
          const locationResults = await Promise.all(locationPromises);
          activity.locationObjects = locationResults.filter(loc => loc !== null);
        } catch (error) {
          console.error("Error loading location objects:", error);
          activity.locationObjects = [];
        }
      } else {
        activity.locationObjects = [];
      }
      
      return activity;
    } catch (error) {
      console.error("Error in getActivityById:", error);
      return null;
    }
  },
  
  // Create a new activity
  async createActivity(activityData: Omit<Activity, "id" | "createdAt" | "updatedAt" | "isExpired">): Promise<string> {
    try {
      const now = new Date();
      const isExpired = new Date(activityData.endDate) < now;
      
      const docRef = await addDoc(activitiesCollection, {
        ...activityData,
        startDate: Timestamp.fromDate(new Date(activityData.startDate)),
        endDate: Timestamp.fromDate(new Date(activityData.endDate)),
        isExpired,
        currentParticipants: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  },
  
  // Update an activity
  async updateActivity(id: string, data: Partial<Activity>): Promise<void> {
    try {
      const docRef = doc(activitiesCollection, id);
      const updateData: any = { ...data };
      
      if (updateData.startDate) {
        updateData.startDate = Timestamp.fromDate(new Date(updateData.startDate));
      }
      
      if (updateData.endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(updateData.endDate));
        const now = new Date();
        if (new Date(updateData.endDate) < now) {
          updateData.isExpired = true;
        }
      }
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  },
  
  // Delete an activity
  async deleteActivity(id: string): Promise<void> {
    try {
      const docRef = doc(activitiesCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw error;
    }
  },
  
  // Toggle activity status
  async toggleActivityStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(activitiesCollection, id);
      await updateDoc(docRef, { 
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling activity status:", error);
      throw error;
    }
  }
}; 