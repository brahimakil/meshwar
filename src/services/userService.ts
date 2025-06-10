import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth
} from "firebase/auth";
import { db } from "@/lib/firebase";
import { User, UserRole } from "@/types/user";
import { initializeApp } from "firebase/app";
import { safeToDate } from "@/utils/dateUtils";

const usersCollection = collection(db, "users");
const auth = getAuth();

export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const q = query(usersCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        // Debug: Log raw date values
        console.debug(`[UserService] Raw dates for ${docSnap.id}:`, {
          dob: data.dob,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
        
        return {
          id: docSnap.id,
          email: data.email ?? '',
          displayName: data.displayName ?? '',
          role: data.role ?? 'user',
          dob: safeToDate(data.dob),
          profileImage: data.profileImage ?? '',
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        } as User;
      });
      return users;
    } catch (error) {
      console.error("[UserService] Error in getUsers:", error);
      throw new Error("Failed to fetch users. See console for details.");
    }
  },
  
  // Get a single user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(usersCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role || 'user',
        dob: data.dob ? safeToDate(data.dob) : null,
        profileImage: data.profileImage || '',
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      } as User;
    } catch (error) {
      console.error("Error in getUserById:", error);
      return null;
    }
  },
  
  // Create a new user
  async createUser(email: string, password: string, displayName: string, dob: Date, role: UserRole = "user"): Promise<string> {
    try {
      // Use Firebase REST API to create a user without affecting auth state
      const apiKey = auth.app.options.apiKey;
      
      // Step 1: Create the user in Firebase Auth via REST API
      const authResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true
          })
        }
      );
      
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create user');
      }
      
      const authData = await authResponse.json();
      const userId = authData.localId;
      
      // Step 2: Update the user profile with display name
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idToken: authData.idToken,
            displayName,
            returnSecureToken: false
          })
        }
      );
      
      // Step 3: Store user data in Firestore
      const userData = {
        email,
        displayName,
        role,
        dob: Timestamp.fromDate(new Date(dob)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, "users", userId), userData);
      
      return userId;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
  
  // Update a user
  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    try {
      const docRef = doc(usersCollection, id);
      
      // Convert dates to Firestore timestamps if they exist in the update data
      const updateData: any = { ...userData, updatedAt: serverTimestamp() };
      
      if (userData.dob) {
        updateData.dob = Timestamp.fromDate(new Date(userData.dob));
      }
      
      // Handle profile image update
      if (userData.profileImage) {
        updateData.profileImage = userData.profileImage;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },
  
  // Delete a user
  async deleteUser(id: string): Promise<void> {
    try {
      const docRef = doc(usersCollection, id);
      await deleteDoc(docRef);
      // Note: This only deletes the Firestore document
      // To fully delete the user, you would also need to delete the Auth user
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
  
  // Calculate age from date of birth
  calculateAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}; 