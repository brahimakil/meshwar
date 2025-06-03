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

export const locationService = {
  // Get all locations
  async getLocations(): Promise<Location[]> {
    const q = query(locationsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Location));

    // Fetch categories for each location
    for (let location of locations) {
      if (location.categoryId) {
        location.category = await categoryService.getCategoryById(location.categoryId);
      }
    }
    
    return locations;
  },
  
  // Get locations by category
  async getLocationsByCategory(categoryId: string): Promise<Location[]> {
    const q = query(
      locationsCollection, 
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Location));

    // Fetch category
    const category = await categoryService.getCategoryById(categoryId);
    
    // Add category to each location
    return locations.map(location => ({
      ...location,
      category
    }));
  },
  
  // Get a single location by ID
  async getLocationById(id: string): Promise<Location | null> {
    const docRef = doc(locationsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    const location = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Location;
    
    // Fetch category if categoryId exists
    if (location.categoryId) {
      location.category = await categoryService.getCategoryById(location.categoryId);
    }
    
    return location;
  },
  
  // Create a new location
  async createLocation(location: Omit<Location, "id" | "createdAt" | "updatedAt">): Promise<Location> {
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
  },
  
  // Update an existing location
  async updateLocation(id: string, location: Partial<Omit<Location, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    const docRef = doc(locationsCollection, id);
    
    await updateDoc(docRef, {
      ...location,
      updatedAt: serverTimestamp(),
    });
  },
  
  // Delete a location
  async deleteLocation(id: string): Promise<void> {
    const docRef = doc(locationsCollection, id);
    await deleteDoc(docRef);
  },
  
  // Toggle location active status
  async toggleLocationStatus(id: string, isActive: boolean): Promise<void> {
    const docRef = doc(locationsCollection, id);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  }
}; 