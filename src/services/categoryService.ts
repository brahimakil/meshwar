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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/types/category";

const categoriesCollection = collection(db, "categories");

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

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const q = query(categoriesCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.name || '',
          description: data.description || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        } as Category;
      });
    } catch (error) {
      console.error("Error in getCategories:", error);
      throw new Error("Failed to fetch categories");
    }
  },
  
  // Get a single category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const docRef = doc(categoriesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      } as Category;
    } catch (error) {
      console.error("Error in getCategoryById:", error);
      return null;
    }
  },
  
  // Create a new category
  async createCategory(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    try {
      const newCategoryData = {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(categoriesCollection, newCategoryData);
      
      return {
        id: docRef.id,
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Category;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },
  
  // Update an existing category
  async updateCategory(id: string, category: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    try {
      const docRef = doc(categoriesCollection, id);
      
      await updateDoc(docRef, {
        ...category,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },
  
  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    try {
      const docRef = doc(categoriesCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
  
  // Toggle category active status
  async toggleCategoryStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(categoriesCollection, id);
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error toggling category status:", error);
      throw error;
    }
  }
}; 