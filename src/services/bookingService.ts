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
  increment,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { userService } from "./userService";
import { activityService } from "./activityService";

const bookingsCollection = collection(db, "bookings");

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

export const bookingService = {
  // Get all bookings
  async getBookings(): Promise<Booking[]> {
    try {
      console.log("[DEBUG] Starting bookingService.getBookings");
      const q = query(bookingsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      console.log(`[DEBUG] Retrieved ${snapshot.docs.length} bookings`);
      
      const bookings: Booking[] = [];
      
      for (const docSnap of snapshot.docs) {
        try {
          console.log(`[DEBUG] Processing booking document: ${docSnap.id}`);
          
          // Enhanced validation for document snapshot
          if (!docSnap.exists()) {
            console.warn(`[WARNING] Booking document ${docSnap.id} does not exist`);
            continue;
          }
          
          const data = docSnap.data();
          if (!data) {
            console.warn(`[WARNING] No data for booking document ${docSnap.id}`);
            continue;
          }
          
          console.log(`[DEBUG] Raw booking data for ${docSnap.id}:`, data);
          
          const booking: Booking = {
            id: docSnap.id,
            userId: data.userId || '',
            activityId: data.activityId || '',
            status: data.status || 'pending',
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
          };
          
          console.log(`[DEBUG] Converted booking ${docSnap.id}:`, booking);
          bookings.push(booking);
        } catch (docError) {
          console.error(`[ERROR] Error processing booking document ${docSnap.id}:`, docError);
        }
      }
      
      console.log(`[DEBUG] Successfully processed ${bookings.length} bookings`);
      return bookings;
    } catch (error) {
      console.error("[CRITICAL] Error in getBookings:", error);
      throw new Error(`Failed to fetch bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Get bookings by activity ID
  async getBookingsByActivity(activityId: string): Promise<Booking[]> {
    try {
      console.log(`[DEBUG] Getting bookings for activity: ${activityId}`);
      const q = query(
        bookingsCollection, 
        where("activityId", "==", activityId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      console.log(`[DEBUG] Found ${snapshot.docs.length} bookings for activity ${activityId}`);
      
      const bookings: Booking[] = [];
      
      for (const docSnap of snapshot.docs) {
        try {
          if (!docSnap.exists()) {
            console.warn(`[WARNING] Booking document ${docSnap.id} does not exist`);
            continue;
          }
          
          const data = docSnap.data();
          if (!data) {
            console.warn(`[WARNING] No data for booking document ${docSnap.id}`);
            continue;
          }
          
          const booking: Booking = {
            id: docSnap.id,
            userId: data.userId || '',
            activityId: data.activityId || '',
            status: data.status || 'pending',
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
          };
          
          // Fetch user details for each booking
          try {
            booking.userObject = await userService.getUserById(booking.userId);
          } catch (error) {
            console.error(`Error fetching user for booking ${booking.id}:`, error);
            booking.userObject = null;
          }
          
          bookings.push(booking);
        } catch (docError) {
          console.error(`[ERROR] Error processing booking document ${docSnap.id}:`, docError);
        }
      }
      
      return bookings;
    } catch (error) {
      console.error(`[ERROR] Error in getBookingsByActivity for ${activityId}:`, error);
      throw new Error(`Failed to fetch bookings for activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Get bookings by user ID
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    try {
      const q = query(
        bookingsCollection, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      
      const bookings: Booking[] = [];
      
      for (const docSnap of snapshot.docs) {
        try {
          if (!docSnap.exists()) {
            console.warn(`[WARNING] Booking document ${docSnap.id} does not exist`);
            continue;
          }
          
          const data = docSnap.data();
          if (!data) {
            console.warn(`[WARNING] No data for booking document ${docSnap.id}`);
            continue;
          }
          
          const booking: Booking = {
            id: docSnap.id,
            userId: data.userId || '',
            activityId: data.activityId || '',
            status: data.status || 'pending',
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
          };
          
          // Fetch activity details for each booking
          try {
            booking.activityObject = await activityService.getActivityById(booking.activityId);
          } catch (error) {
            console.error(`Error fetching activity for booking ${booking.id}:`, error);
            booking.activityObject = null;
          }
          
          bookings.push(booking);
        } catch (docError) {
          console.error(`[ERROR] Error processing booking document ${docSnap.id}:`, docError);
        }
      }
      
      return bookings;
    } catch (error) {
      console.error(`[ERROR] Error in getBookingsByUser for ${userId}:`, error);
      throw new Error(`Failed to fetch bookings for user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Get a booking by ID
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      console.log(`[DEBUG] Getting booking by ID: ${id}`);
      const docRef = doc(bookingsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap || !docSnap.exists()) {
        console.warn(`[WARNING] Booking document ${id} does not exist`);
        return null;
      }
      
      const data = docSnap.data();
      if (!data) {
        console.warn(`[WARNING] No data for booking document ${id}`);
        return null;
      }
      
      const booking: Booking = {
        id: docSnap.id,
        userId: data.userId || '',
        activityId: data.activityId || '',
        status: data.status || 'pending',
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      };
      
      // Fetch related objects
      try {
        booking.userObject = await userService.getUserById(booking.userId);
        booking.activityObject = await activityService.getActivityById(booking.activityId);
      } catch (error) {
        console.error(`Error fetching related objects for booking ${id}:`, error);
      }
      
      return booking;
    } catch (error) {
      console.error(`[ERROR] Error in getBookingById for ${id}:`, error);
      throw new Error(`Failed to fetch booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Create a new booking
  async createBooking(bookingData: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      // Check if the activity has reached its participant limit
      const activityRef = doc(db, "activities", bookingData.activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (!activitySnap.exists()) {
        throw new Error("Activity not found");
      }
      
      const activityData = activitySnap.data();
      const currentParticipants = activityData.currentParticipants || 0;
      const participantLimit = activityData.participantLimit || 0;
      
      if (participantLimit > 0 && currentParticipants >= participantLimit) {
        throw new Error("Activity has reached its participant limit");
      }
      
      // Check if the user is already booked for this activity
      const existingBookingQuery = query(
        bookingsCollection,
        where("userId", "==", bookingData.userId),
        where("activityId", "==", bookingData.activityId),
        where("status", "in", ["confirmed", "pending"]) // Only check active bookings
      );
      
      const existingBookingSnapshot = await getDocs(existingBookingQuery);
      
      if (!existingBookingSnapshot.empty) {
        throw new Error("This user is already booked for this activity");
      }
      
      // Use a transaction to create booking and update activity participant count
      return await runTransaction(db, async (transaction) => {
        // Create the booking
        const bookingRef = doc(collection(db, "bookings"));
        transaction.set(bookingRef, {
          ...bookingData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Update the activity's participant count
        transaction.update(activityRef, {
          currentParticipants: increment(1),
          updatedAt: serverTimestamp()
        });
        
        return bookingRef.id;
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },
  
  // Update a booking
  async updateBooking(id: string, data: Partial<Booking>): Promise<void> {
    const docRef = doc(bookingsCollection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  
  // Delete a booking
  async deleteBooking(id: string): Promise<void> {
    try {
      // Get the booking to get the activity ID
      const bookingRef = doc(bookingsCollection, id);
      const bookingSnap = await getDoc(bookingRef);
      
      if (!bookingSnap.exists()) {
        throw new Error("Booking not found");
      }
      
      const bookingData = bookingSnap.data();
      const activityId = bookingData.activityId;
      
      // Use a transaction to delete booking and update activity participant count
      await runTransaction(db, async (transaction) => {
        // Delete the booking
        transaction.delete(bookingRef);
        
        // Update the activity's participant count
        const activityRef = doc(db, "activities", activityId);
        transaction.update(activityRef, {
          currentParticipants: increment(-1),
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw error;
    }
  },
  
  // Change booking status
  async changeBookingStatus(id: string, status: "confirmed" | "pending" | "cancelled"): Promise<void> {
    const docRef = doc(bookingsCollection, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  }
}; 