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
  getFirestore
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Location } from "@/types/location";
import { categoryService } from "./categoryService";

const locationsCollection = collection(db, "locations");

// Helper function to safely convert Firestore timestamp to Date
function safeToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

export const locationService = {
  // Get all locations
  async getLocations(): Promise<Location[]> {
    try {
      const q = query(locationsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const locations = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          coordinates: data.coordinates || { lat: 0, lng: 0 },
          categoryId: data.categoryId || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          icon: data.icon || '',
          images: data.images || [],
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        } as Location;
      });

      // Fetch categories for each location
      for (let location of locations) {
        if (location.categoryId) {
          try {
            location.category = await categoryService.getCategoryById(location.categoryId);
          } catch (error) {
            console.error("Error fetching category for location:", error);
            location.category = null;
          }
        }
      }
      
      return locations;
    } catch (error) {
      console.error("Error in getLocations:", error);
      throw new Error("Failed to fetch locations");
    }
  },
  
  // Get locations by category
  async getLocationsByCategory(categoryId: string): Promise<Location[]> {
    try {
      const q = query(
        locationsCollection, 
        where("categoryId", "==", categoryId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      
      const locations = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          coordinates: data.coordinates || { lat: 0, lng: 0 },
          categoryId: data.categoryId || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          icon: data.icon || '',
          images: data.images || [],
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        } as Location;
      });

      // Fetch category
      const category = await categoryService.getCategoryById(categoryId);
      
      // Add category to each location
      return locations.map(location => ({
        ...location,
        category
      }));
    } catch (error) {
      console.error("Error in getLocationsByCategory:", error);
      throw new Error("Failed to fetch locations by category");
    }
  },
  
  // Get a single location by ID
  async getLocationById(id: string): Promise<Location | null> {
    try {
      const docRef = doc(locationsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      const location = {
        id: docSnap.id,
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        coordinates: data.coordinates || { lat: 0, lng: 0 },
        categoryId: data.categoryId || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        icon: data.icon || '',
        images: data.images || [],
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      } as Location;
      
      // Fetch category if categoryId exists
      if (location.categoryId) {
        try {
          location.category = await categoryService.getCategoryById(location.categoryId);
        } catch (error) {
          console.error("Error fetching category for location:", error);
          location.category = null;
        }
      }
      
      return location;
    } catch (error) {
      console.error("Error in getLocationById:", error);
      return null;
    }
  },
  
  // Create a new location
  async createLocation(location: Omit<Location, "id" | "createdAt" | "updatedAt">): Promise<Location> {
    try {
      const newLocationData = {
        ...location,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(locationsCollection, newLocationData);
      
      return {
        id: docRef.id,
        ...location,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Location;
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  },
  
  // Update an existing location
  async updateLocation(id: string, location: Partial<Omit<Location, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    try {
      const docRef = doc(locationsCollection, id);
      
      await updateDoc(docRef, {
        ...location,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },
  
  // Delete a location
  async deleteLocation(id: string): Promise<void> {
    try {
      const docRef = doc(locationsCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting location:", error);
      throw error;
    }
  },
  
  // Toggle location active status
  async toggleLocationStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(locationsCollection, id);
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error toggling location status:", error);
      throw error;
    }
  }
}; 