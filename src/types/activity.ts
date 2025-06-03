import { Location } from "./location";

export interface Activity {
  id: string;
  title: string;
  description: string;
  startDate: Date | any;
  endDate: Date | any;
  startTime: string;
  endTime: string;
  locations: string[]; // Array of location IDs
  locationObjects?: Location[]; // Populated location objects
  isActive: boolean;
  isExpired: boolean;
  difficulty: "easy" | "moderate" | "hard";
  ageGroup: "all" | "adults" | "children" | "seniors";
  estimatedDuration: number; // In minutes
  estimatedCost: number; // In currency
  tags: string[];
  participantLimit: number; // Maximum number of participants
  currentParticipants?: number; // Current number of participants
  createdAt: Date | any;
  updatedAt: Date | any;
} 