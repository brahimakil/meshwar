import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types/user";
import { Activity } from "@/types/activity";
import { Location } from "@/types/location";

// Define time periods for filtering data
export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all';

// Define dashboard stats interface
export interface DashboardStats {
  totalUsers: number;
  totalLocations: number;
  totalActivities: number;
  activeActivities: number;
  userGrowth: number; // percentage
  locationGrowth: number; // percentage
  activityGrowth: number; // percentage
  activitiesByDifficulty: Record<string, number>;
  activitiesByAgeGroup: Record<string, number>;
  upcomingActivities: Array<{
    id: string;
    title: string;
    startDate: string;
  }>;
}

// Define chart data interfaces
export interface TimeSeriesData {
  date: string;
  users?: number;
  activities?: number;
  locations?: number;
}

export interface PieChartData {
  name: string;
  value: number;
}

export const dashboardService = {
  // Get dashboard statistics
  async getDashboardStats(period: TimePeriod = 'month'): Promise<DashboardStats> {
    // Get date range based on period
    const { startDate, previousStartDate } = this.getDateRange(period);
    
    // Get collections
    const usersCollection = collection(db, "users");
    const locationsCollection = collection(db, "locations");
    const activitiesCollection = collection(db, "activities");
    
    // Get current period data
    const userQuery = query(
      usersCollection, 
      where("createdAt", ">=", Timestamp.fromDate(startDate))
    );
    const locationQuery = query(
      locationsCollection, 
      where("createdAt", ">=", Timestamp.fromDate(startDate))
    );
    const activityQuery = query(
      activitiesCollection, 
      where("createdAt", ">=", Timestamp.fromDate(startDate))
    );
    const activeActivityQuery = query(
      activitiesCollection, 
      where("isActive", "==", true),
      where("isExpired", "==", false)
    );
    
    // Get previous period data for comparison
    const prevUserQuery = query(
      usersCollection, 
      where("createdAt", ">=", Timestamp.fromDate(previousStartDate)),
      where("createdAt", "<", Timestamp.fromDate(startDate))
    );
    const prevLocationQuery = query(
      locationsCollection, 
      where("createdAt", ">=", Timestamp.fromDate(previousStartDate)),
      where("createdAt", "<", Timestamp.fromDate(startDate))
    );
    const prevActivityQuery = query(
      activitiesCollection, 
      where("createdAt", ">=", Timestamp.fromDate(previousStartDate)),
      where("createdAt", "<", Timestamp.fromDate(startDate))
    );
    
    // Execute queries
    const [
      userSnapshot, 
      locationSnapshot, 
      activitySnapshot, 
      activeActivitySnapshot,
      prevUserSnapshot,
      prevLocationSnapshot,
      prevActivitySnapshot
    ] = await Promise.all([
      getDocs(userQuery),
      getDocs(locationQuery),
      getDocs(activityQuery),
      getDocs(activeActivityQuery),
      getDocs(prevUserQuery),
      getDocs(prevLocationQuery),
      getDocs(prevActivityQuery)
    ]);
    
    // Get total counts
    const totalUsers = userSnapshot.size;
    const totalLocations = locationSnapshot.size;
    const totalActivities = activitySnapshot.size;
    const activeActivities = activeActivitySnapshot.size;
    
    // Get previous period counts
    const prevUsers = prevUserSnapshot.size;
    const prevLocations = prevLocationSnapshot.size;
    const prevActivities = prevActivitySnapshot.size;
    
    // Calculate growth percentages
    const userGrowth = prevUsers === 0 ? 100 : ((totalUsers - prevUsers) / prevUsers) * 100;
    const locationGrowth = prevLocations === 0 ? 100 : ((totalLocations - prevLocations) / prevLocations) * 100;
    const activityGrowth = prevActivities === 0 ? 100 : ((totalActivities - prevActivities) / prevActivities) * 100;
    
    // Get activities by difficulty
    const activitiesByDifficulty: Record<string, number> = {
      easy: 0,
      moderate: 0,
      challenging: 0
    };
    
    // Get activities by age group
    const activitiesByAgeGroup: Record<string, number> = {
      all: 0,
      adults: 0,
      children: 0,
      seniors: 0
    };
    
    // Process all activities to categorize them
    const allActivitiesQuery = query(activitiesCollection);
    const allActivitiesSnapshot = await getDocs(allActivitiesQuery);
    
    allActivitiesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by difficulty
      if (data.difficulty) {
        const difficulty = data.difficulty.toLowerCase();
        if (activitiesByDifficulty[difficulty] !== undefined) {
          activitiesByDifficulty[difficulty]++;
        }
      }
      
      // Count by age group
      if (data.ageGroup) {
        const ageGroup = data.ageGroup.toLowerCase();
        if (activitiesByAgeGroup[ageGroup] !== undefined) {
          activitiesByAgeGroup[ageGroup]++;
        }
      }
    });
    
    // Get upcoming activities
    const now = new Date();
    const limitFunc = limit; // Assign to a different name to avoid potential shadowing
    const upcomingActivitiesQuery = query(
      activitiesCollection,
      where("startDate", ">=", Timestamp.fromDate(now)),
      where("isActive", "==", true),
      orderBy("startDate", "asc"),
      limitFunc(5)
    );
    
    const upcomingActivitiesSnapshot = await getDocs(upcomingActivitiesQuery);
    
    const upcomingActivities = upcomingActivitiesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        startDate: data.startDate.toDate().toISOString()
      };
    });
    
    return {
      totalUsers,
      totalLocations,
      totalActivities,
      activeActivities,
      userGrowth,
      locationGrowth,
      activityGrowth,
      activitiesByDifficulty,
      activitiesByAgeGroup,
      upcomingActivities
    };
  },
  
  // Get time series data for charts
  async getTimeSeriesData(period: TimePeriod = 'month'): Promise<TimeSeriesData[]> {
    const { startDate } = this.getDateRange(period);
    const intervals = this.getTimeIntervals(startDate, period);
    
    // Get collections
    const usersCollection = collection(db, "users");
    const locationsCollection = collection(db, "locations");
    const activitiesCollection = collection(db, "activities");
    
    // Get all data since start date
    const userQuery = query(
      usersCollection, 
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      orderBy("createdAt", "asc")
    );
    const locationQuery = query(
      locationsCollection, 
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      orderBy("createdAt", "asc")
    );
    const activityQuery = query(
      activitiesCollection, 
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      orderBy("createdAt", "asc")
    );
    
    // Execute queries
    const [userSnapshot, locationSnapshot, activitySnapshot] = await Promise.all([
      getDocs(userQuery),
      getDocs(locationQuery),
      getDocs(activityQuery)
    ]);
    
    // Process data into time series
    const userDocs = userSnapshot.docs.map(doc => ({
      date: doc.data().createdAt.toDate(),
      type: 'user'
    }));
    
    const locationDocs = locationSnapshot.docs.map(doc => ({
      date: doc.data().createdAt.toDate(),
      type: 'location'
    }));
    
    const activityDocs = activitySnapshot.docs.map(doc => ({
      date: doc.data().createdAt.toDate(),
      type: 'activity'
    }));
    
    // Combine all data
    const allDocs = [...userDocs, ...locationDocs, ...activityDocs];
    
    // Group by interval
    return intervals.map(interval => {
      const nextInterval = new Date(interval);
      nextInterval.setDate(nextInterval.getDate() + this.getIntervalDays(period));
      
      const intervalData = allDocs.filter(doc => 
        doc.date >= interval && doc.date < nextInterval
      );
      
      const users = intervalData.filter(doc => doc.type === 'user').length;
      const locations = intervalData.filter(doc => doc.type === 'location').length;
      const activities = intervalData.filter(doc => doc.type === 'activity').length;
      
      return {
        date: this.formatDate(interval, period),
        users,
        locations,
        activities
      };
    });
  },
  
  // Get location popularity data for pie chart
  async getLocationPopularityData(): Promise<PieChartData[]> {
    const activitiesCollection = collection(db, "activities");
    const activitySnapshot = await getDocs(activitiesCollection);
    
    // Count activities per location
    const locationCounts: Record<string, number> = {};
    
    activitySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.locations && Array.isArray(data.locations)) {
        data.locations.forEach((locationId: string) => {
          locationCounts[locationId] = (locationCounts[locationId] || 0) + 1;
        });
      }
    });
    
    // Get location names
    const locationsCollection = collection(db, "locations");
    const locationSnapshot = await getDocs(locationsCollection);
    
    const locationMap: Record<string, string> = {};
    locationSnapshot.forEach(doc => {
      locationMap[doc.id] = doc.data().name;
    });
    
    // Create pie chart data
    const pieData: PieChartData[] = Object.entries(locationCounts)
      .map(([locationId, count]) => ({
        name: locationMap[locationId] || 'Unknown',
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5 locations
    
    return pieData;
  },
  
  // Get recent activities for the dashboard
  async getRecentActivities(limitCount: number = 5): Promise<any[]> {
    try {
      const activitiesCollection = collection(db, "activities");
      
      // Make sure we're using the imported limit function
      const limitFunc = limit; // Assign to a different name to avoid potential shadowing
      
      const q = query(
        activitiesCollection,
        orderBy("createdAt", "desc"),
        limitFunc(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          type: 'activity'
        };
      });
    } catch (error) {
      console.error("Error in getRecentActivities:", error);
      return []; // Return empty array on error
    }
  },
  
  // Get recent user signups for the dashboard
  async getRecentUsers(limitCount: number = 5): Promise<any[]> {
    try {
      const usersCollection = collection(db, "users");
      
      // Make sure we're using the imported limit function
      const limitFunc = limit; // Assign to a different name to avoid potential shadowing
      
      const q = query(
        usersCollection,
        orderBy("createdAt", "desc"),
        limitFunc(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          type: 'user'
        };
      });
    } catch (error) {
      console.error("Error in getRecentUsers:", error);
      return []; // Return empty array on error
    }
  },
  
  // Get recent activity combined (users and activities)
  async getRecentActivity(limitCount: number = 5): Promise<any[]> {
    const [recentUsers, recentActivities] = await Promise.all([
      this.getRecentUsers(limitCount),
      this.getRecentActivities(limitCount)
    ]);
    
    // Combine and sort by createdAt
    return [...recentUsers, ...recentActivities]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limitCount);
  },
  
  // Helper function to get date range based on period
  getDateRange(period: TimePeriod): { startDate: Date, previousStartDate: Date } {
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Some arbitrary start date
        previousStartDate = new Date(2020, 0, 1);
        break;
    }
    
    return { startDate, previousStartDate };
  },
  
  // Helper function to get time intervals for charts
  getTimeIntervals(startDate: Date, period: TimePeriod): Date[] {
    const intervals: Date[] = [];
    const now = new Date();
    let current = new Date(startDate);
    
    switch (period) {
      case 'day':
        // Hourly intervals
        while (current <= now) {
          intervals.push(new Date(current));
          current.setHours(current.getHours() + 1);
        }
        break;
      case 'week':
        // Daily intervals
        while (current <= now) {
          intervals.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        break;
      case 'month':
        // Daily intervals
        while (current <= now) {
          intervals.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        break;
      case 'year':
        // Monthly intervals
        while (current <= now) {
          intervals.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
        break;
      case 'all':
        // Monthly intervals
        while (current <= now) {
          intervals.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
        break;
    }
    
    return intervals;
  },
  
  // Helper function to get interval days
  getIntervalDays(period: TimePeriod): number {
    switch (period) {
      case 'day': return 0.04; // ~1 hour
      case 'week': return 1;
      case 'month': return 1;
      case 'year': return 30;
      case 'all': return 30;
      default: return 1;
    }
  },
  
  // Helper function to format dates for chart labels
  formatDate(date: Date, period: TimePeriod): string {
    switch (period) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      case 'year':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      case 'all':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  }
}; 
