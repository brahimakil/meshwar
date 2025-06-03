import { Category } from "./category";

export interface Location {
  id: string;
  name: string;
  description?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  categoryId: string;
  category?: Category;
  icon?: string; // Base64 encoded icon
  images: string[]; // Base64 encoded images
  isActive: boolean;
  createdAt: Date | any;
  updatedAt: Date | any;
} 