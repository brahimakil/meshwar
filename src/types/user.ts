export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  dob: Date | any; // Date of birth
  profileImage?: string; // Base64 encoded image
  createdAt: Date | any;
  updatedAt?: Date | any;
} 