export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
  isActive: boolean;
} 