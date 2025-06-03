import { User } from "./user";
import { Activity } from "./activity";

export interface Booking {
  id: string;
  userId: string;
  activityId: string;
  userObject?: User;
  activityObject?: Activity;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: Date | any;
  updatedAt: Date | any;
} 