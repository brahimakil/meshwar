"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Category } from "@/types/category";
import { categoryService } from "@/services/categoryService";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      await categoryService.toggleCategoryStatus(id, !currentStatus);
      
      // Update the local state
      setCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === id ? { ...category, isActive: !currentStatus } : category
        )
      );
    } catch (err) {
      console.error("Error toggling category status:", err);
      setError("Failed to update category status. Please try again.");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }
    
    try {
      await categoryService.deleteCategory(id);
      
      // Remove from local state
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== id)
      );
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Failed to delete category. Please try again.");
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage categories for locations
            </p>
          </div>
          
          <button
            onClick={() => router.push("/categories/new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card">
            <p className="text-muted-foreground">No categories found. Create your first category!</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Description</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {category.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {category.description || "No description"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full mr-2 ${
                            category.isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></span>
                        <span>{category.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(category.id, category.isActive)}
                          className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                          title={category.isActive ? "Deactivate" : "Activate"}
                        >
                          {category.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => router.push(`/categories/${category.id}`)}
                          className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 