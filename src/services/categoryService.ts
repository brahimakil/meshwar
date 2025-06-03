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

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const q = query(categoriesCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Category));
  },
  
  // Get a single category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const docRef = doc(categoriesCollection, id);
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
    } as Category;
  },
  
  // Create a new category
  async createCategory(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
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
  },
  
  // Update an existing category
  async updateCategory(id: string, category: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    const docRef = doc(categoriesCollection, id);
    
    await updateDoc(docRef, {
      ...category,
      updatedAt: serverTimestamp(),
    });
  },
  
  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(categoriesCollection, id);
    await deleteDoc(docRef);
  },
  
  // Toggle category active status
  async toggleCategoryStatus(id: string, isActive: boolean): Promise<void> {
    const docRef = doc(categoriesCollection, id);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  }
}; 