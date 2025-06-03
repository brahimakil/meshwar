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

const activitiesCollection = collection(db, "activities");

export const activityService = {
  // Get all activities
  async getActivities(): Promise<Activity[]> {
    const q = query(activitiesCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Activity));

    // Check if activities are expired
    const now = new Date();
    activities.forEach(activity => {
      if (activity.endDate < now) {
        activity.isExpired = true;
        // Update in Firestore if not already marked as expired
        if (!doc.data().isExpired) {
          this.updateActivity(activity.id, { isExpired: true });
        }
      }
    });
    
    return activities;
  },
  
  // Get a single activity by ID
  async getActivityById(id: string): Promise<Activity | null> {
    const docRef = doc(activitiesCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    const activity = {
      id: docSnap.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Activity;
    
    // Check if activity is expired
    const now = new Date();
    if (activity.endDate < now && !activity.isExpired) {
      activity.isExpired = true;
      // Update in Firestore
      await this.updateActivity(activity.id, { isExpired: true });
    }
    
    // Fetch location objects
    if (activity.locations && activity.locations.length > 0) {
      try {
        const locationPromises = activity.locations.map(locationId => 
          locationService.getLocationById(locationId)
        );
        
        const locationResults = await Promise.all(locationPromises);
        // Filter out any null results (in case a location ID doesn't exist)
        activity.locationObjects = locationResults.filter(loc => loc !== null) as Location[];
        
        console.log("Loaded location objects:", activity.locationObjects);
      } catch (error) {
        console.error("Error loading location objects:", error);
        // Initialize as empty array if there's an error
        activity.locationObjects = [];
      }
    } else {
      activity.locationObjects = [];
    }
    
    return activity;
  },
  
  // Create a new activity
  async createActivity(activityData: Omit<Activity, "id" | "createdAt" | "updatedAt" | "isExpired">): Promise<string> {
    // Check if the activity is already expired based on end date
    const now = new Date();
    const isExpired = new Date(activityData.endDate) < now;
    
    const docRef = await addDoc(activitiesCollection, {
      ...activityData,
      startDate: Timestamp.fromDate(new Date(activityData.startDate)),
      endDate: Timestamp.fromDate(new Date(activityData.endDate)),
      isExpired,
      currentParticipants: 0, // Initialize participant count
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  },
  
  // Update an activity
  async updateActivity(id: string, data: Partial<Activity>): Promise<void> {
    const docRef = doc(activitiesCollection, id);
    
    // Convert dates to Firestore Timestamps if they exist in the data
    const updateData = { ...data };
    
    if (updateData.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(updateData.startDate));
    }
    
    if (updateData.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(updateData.endDate));
      
      // Check if the activity is expired based on end date
      const now = new Date();
      if (new Date(updateData.endDate) < now) {
        updateData.isExpired = true;
      }
    }
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  },
  
  // Delete an activity
  async deleteActivity(id: string): Promise<void> {
    const docRef = doc(activitiesCollection, id);
    await deleteDoc(docRef);
  },
  
  // Toggle activity status (active/inactive)
  async toggleActivityStatus(id: string, isActive: boolean): Promise<void> {
    const docRef = doc(activitiesCollection, id);
    await updateDoc(docRef, { 
      isActive,
      updatedAt: serverTimestamp()
    });
  }
}; 