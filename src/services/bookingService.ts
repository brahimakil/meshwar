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

export const bookingService = {
  // Get all bookings
  async getBookings(): Promise<Booking[]> {
    const q = query(bookingsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Booking));
    
    return bookings;
  },
  
  // Get bookings by activity ID
  async getBookingsByActivity(activityId: string): Promise<Booking[]> {
    const q = query(
      bookingsCollection, 
      where("activityId", "==", activityId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Booking));
    
    // Fetch user details for each booking
    for (let booking of bookings) {
      booking.userObject = await userService.getUserById(booking.userId);
    }
    
    return bookings;
  },
  
  // Get bookings by user ID
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    const q = query(
      bookingsCollection, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Booking));
    
    // Fetch activity details for each booking
    for (let booking of bookings) {
      booking.activityObject = await activityService.getActivityById(booking.activityId);
    }
    
    return bookings;
  },
  
  // Get a booking by ID
  async getBookingById(id: string): Promise<Booking | null> {
    const docRef = doc(bookingsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const booking = {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Booking;
    
    // Fetch related objects
    booking.userObject = await userService.getUserById(booking.userId);
    booking.activityObject = await activityService.getActivityById(booking.activityId);
    
    return booking;
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