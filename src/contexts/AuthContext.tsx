"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "user";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: any; // Using 'any' to accommodate both Date and serverTimestamp
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user data from Firestore
  async function fetchUserData(user: User) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({ 
          uid: user.uid, 
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date()
        });
      } else {
        console.error("No user data found in Firestore");
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        try {
          const userDocRef = doc(db, "users", authUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const firestoreUserData = userDoc.data();
            
            setUserData({
              uid: authUser.uid,
              email: firestoreUserData.email || authUser.email,
              displayName: firestoreUserData.displayName || authUser.displayName,
              role: firestoreUserData.role || "user",
              createdAt: firestoreUserData.createdAt,
            });
            
            localStorage.setItem("userRole", firestoreUserData.role || "user");
            setCurrentUser(authUser);
          } else {
            // User exists in Auth but not in Firestore, create document
            const newUserFirestoreData = {
              email: authUser.email,
              displayName: authUser.displayName,
              role: "user" as UserRole, // Default role, ensure type
              createdAt: serverTimestamp() // Use serverTimestamp when creating
            };
            await setDoc(doc(db, "users", authUser.uid), newUserFirestoreData);
            
            setUserData({
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              role: "user" as UserRole,
              createdAt: new Date() // For local state, use current date after creation
            });
            
            localStorage.setItem("userRole", "user");
            setCurrentUser(authUser);
          }
        } catch (error) {
          console.error("Error fetching or creating user data in Firestore:", error);
          // Fallback if Firestore interaction fails
          setUserData({
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            role: (localStorage.getItem("userRole") as UserRole) || "user",
            createdAt: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime) : new Date() 
          });
          setCurrentUser(authUser);
        }
      } else {
        // User is signed out
        setUserData(null);
        setCurrentUser(null);
        localStorage.removeItem("userRole");
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Signup function - always create admins in this admin interface
  async function signup(email: string, password: string, name: string, role: UserRole = "admin") {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Store additional user data in Firestore
      const userData = {
        email: user.email,
        displayName: name,
        role: "admin", // Force admin role
        createdAt: serverTimestamp()
      };
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), userData);
      
      // Update local state
      setUserData({
        uid: user.uid,
        ...userData,
        createdAt: new Date()
      });
      
      return;
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    }
  }

  // Login function
  async function login(email: string, password: string) {
    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if the user is an admin
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role !== "admin") {
          // Not an admin, sign them out
          await signOut(auth);
          throw new Error("Access denied. Only administrators can log in to this system.");
        }
        
        // Set user data to prevent logout
        setUserData({
          uid: user.uid,
          email: user.email,
          displayName: data.displayName || user.displayName,
          role: data.role,
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date()
        });
        
        // Set current user
        setCurrentUser(user);
        
        // Store role in localStorage
        localStorage.setItem("userRole", data.role);
        
        return user;
      } else {
        // No user data found, create a new user document
        const userData = {
          email: user.email,
          displayName: user.displayName,
          role: "admin", // Default to admin for this admin interface
          createdAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, userData);
        
        // Set user data
        setUserData({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: "admin",
          createdAt: new Date()
        });
        
        // Set current user
        setCurrentUser(user);
        
        // Store role in localStorage
        localStorage.setItem("userRole", "admin");
        
        return user;
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error during password reset:", error);
      throw error;
    }
  }

  const isAdmin = userData?.role === "admin";

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 