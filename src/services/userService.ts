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

const usersCollection = collection(db, "users");
const auth = getAuth();

export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    const q = query(usersCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dob: doc.data().dob?.toDate() || null,
    } as User));
  },
  
  // Get a single user by ID
  async getUserById(id: string): Promise<User | null> {
    const docRef = doc(usersCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      dob: data.dob?.toDate() || null,
    } as User;
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
        createdAt: serverTimestamp()
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
  },
  
  // Delete a user
  async deleteUser(id: string): Promise<void> {
    const docRef = doc(usersCollection, id);
    await deleteDoc(docRef);
    // Note: This only deletes the Firestore document
    // To fully delete the user, you would also need to delete the Auth user
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