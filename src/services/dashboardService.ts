import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  count,
  getCountFromServer
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types/user";
import { Activity } from "@/types/activity";
import { Location } from "@/types/location";
import { safeToDate } from "@/utils/dateUtils";

// Define time periods for filtering data
export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all';

// Define dashboard stats interface
export interface DashboardStats {
  totalUsers: number;
  totalLocations: number;
  totalActivities: number;
  activeActivities: number;
  userGrowth: number;
  locationGrowth: number;
  activityGrowth: number;
  activitiesByDifficulty: Record<string, number>;
  activitiesByAgeGroup: Record<string, number>;
  upcomingActivities: Array<{
    id: string;
    title: string;
    startDate: string;
  }>;
}

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

// In-memory cache with 5-minute TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const dashboardCache = new DashboardCache();

export const dashboardService = {
  // Get all dashboard data in one optimized call
  async getDashboardData(period: TimePeriod = 'month'): Promise<{
    stats: DashboardStats;
    timeSeriesData: TimeSeriesData[];
    locationData: PieChartData[];
    recentActivity: any[];
    locations: any[];
  }> {
    const cacheKey = `dashboard-${period}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached) {
      console.log('Returning cached dashboard data');
      return cached;
    }

    console.log('Fetching fresh dashboard data');
    
    // Execute all queries in parallel for maximum performance
    const [
      stats,
      timeSeriesData,
      locationData,
      recentActivity,
      locations
    ] = await Promise.all([
      this.getOptimizedDashboardStats(period),
      this.getOptimizedTimeSeriesData(period),
      this.getOptimizedLocationPopularityData(),
      this.getOptimizedRecentActivity(5),
      this.getOptimizedLocations()
    ]);

    const result = {
      stats,
      timeSeriesData,
      locationData,
      recentActivity,
      locations
    };

    // Cache for 2 minutes for frequently changing data
    dashboardCache.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
  },

  // Optimized dashboard stats with minimal queries
  async getOptimizedDashboardStats(period: TimePeriod = 'month'): Promise<DashboardStats> {
    const { startDate, previousStartDate } = this.getDateRange(period);
    
    const usersCollection = collection(db, "users");
    const locationsCollection = collection(db, "locations");
    const activitiesCollection = collection(db, "activities");

    // Use count queries for better performance instead of fetching all documents
    const [
      totalUsersCount,
      totalLocationsCount,
      totalActivitiesCount,
      activeActivitiesCount,
      currentPeriodCounts,
      previousPeriodCounts,
      categorizedActivities,
      upcomingActivities
    ] = await Promise.all([
      // Total counts using getCountFromServer for O(1) performance
      getCountFromServer(query(usersCollection)),
      getCountFromServer(query(locationsCollection)),
      getCountFromServer(query(activitiesCollection)),
      getCountFromServer(query(
        activitiesCollection,
        where("isActive", "==", true),
        where("isExpired", "==", false)
      )),
      
      // Current period counts
      Promise.all([
        getCountFromServer(query(
          usersCollection, 
          where("createdAt", ">=", Timestamp.fromDate(startDate))
        )),
        getCountFromServer(query(
          locationsCollection, 
          where("createdAt", ">=", Timestamp.fromDate(startDate))
        )),
        getCountFromServer(query(
          activitiesCollection, 
          where("createdAt", ">=", Timestamp.fromDate(startDate))
        ))
      ]),
      
      // Previous period counts
      Promise.all([
        getCountFromServer(query(
          usersCollection, 
          where("createdAt", ">=", Timestamp.fromDate(previousStartDate)),
          where("createdAt", "<", Timestamp.fromDate(startDate))
        )),
        getCountFromServer(query(
          locationsCollection, 
          where("createdAt", ">=", Timestamp.fromDate(previousStartDate)),
          where("createdAt", "<", Timestamp.fromDate(startDate))
        )),
        getCountFromServer(query(
          activitiesCollection, 
          where("createdAt", ">=", Timestamp.fromDate(previousStartDate)),
          where("createdAt", "<", Timestamp.fromDate(startDate))
        ))
      ]),
      
      // Get categorized activities with limit to avoid full table scan
      this.getOptimizedCategorizedActivities(),
      
      // Get upcoming activities
      getDocs(query(
        activitiesCollection,
        where("startDate", ">=", Timestamp.fromDate(new Date())),
        where("isActive", "==", true),
        orderBy("startDate", "asc"),
        limit(5)
      ))
    ]);

    // Extract counts
    const totalUsers = totalUsersCount.data().count;
    const totalLocations = totalLocationsCount.data().count;
    const totalActivities = totalActivitiesCount.data().count;
    const activeActivities = activeActivitiesCount.data().count;

    const [currentUsers, currentLocations, currentActivitiesCount] = currentPeriodCounts.map(result => result.data().count);
    const [prevUsers, prevLocations, prevActivities] = previousPeriodCounts.map(result => result.data().count);

    // Calculate growth percentages
    const userGrowth = prevUsers === 0 ? 100 : ((currentUsers - prevUsers) / prevUsers) * 100;
    const locationGrowth = prevLocations === 0 ? 100 : ((currentLocations - prevLocations) / prevLocations) * 100;
    const activityGrowth = prevActivities === 0 ? 100 : ((currentActivitiesCount - prevActivities) / prevActivities) * 100;

    const upcomingActivitiesData = upcomingActivities.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        startDate: safeToDate(data.startDate)?.toISOString() || new Date().toISOString()
      };
    });

    return {
      totalUsers,
      totalLocations,
      totalActivities,
      activeActivities,
      userGrowth: Math.round(userGrowth),
      locationGrowth: Math.round(locationGrowth),
      activityGrowth: Math.round(activityGrowth),
      activitiesByDifficulty: categorizedActivities.activitiesByDifficulty,
      activitiesByAgeGroup: categorizedActivities.activitiesByAgeGroup,
      upcomingActivities: upcomingActivitiesData
    };
  },

  // Optimized categorized activities - sample instead of full scan
  async getOptimizedCategorizedActivities(): Promise<{
    activitiesByDifficulty: Record<string, number>;
    activitiesByAgeGroup: Record<string, number>;
  }> {
    const activitiesCollection = collection(db, "activities");
    
    // Use parallel queries for each category instead of scanning all documents
    const [easyActivities, moderateActivities, challengingActivities] = await Promise.all([
      getCountFromServer(query(activitiesCollection, where("difficulty", "==", "easy"))),
      getCountFromServer(query(activitiesCollection, where("difficulty", "==", "moderate"))),
      getCountFromServer(query(activitiesCollection, where("difficulty", "==", "challenging")))
    ]);

    const [allAgeActivities, adultsActivities, childrenActivities, seniorsActivities] = await Promise.all([
      getCountFromServer(query(activitiesCollection, where("ageGroup", "==", "all"))),
      getCountFromServer(query(activitiesCollection, where("ageGroup", "==", "adults"))),
      getCountFromServer(query(activitiesCollection, where("ageGroup", "==", "children"))),
      getCountFromServer(query(activitiesCollection, where("ageGroup", "==", "seniors")))
    ]);

    return {
      activitiesByDifficulty: {
        easy: easyActivities.data().count,
        moderate: moderateActivities.data().count,
        challenging: challengingActivities.data().count
      },
      activitiesByAgeGroup: {
        all: allAgeActivities.data().count,
        adults: adultsActivities.data().count,
        children: childrenActivities.data().count,
        seniors: seniorsActivities.data().count
      }
    };
  },

  // Optimized time series data with sampling
  async getOptimizedTimeSeriesData(period: TimePeriod = 'month'): Promise<TimeSeriesData[]> {
    const { startDate } = this.getDateRange(period);
    const intervals = this.getTimeIntervals(startDate, period);
    
    // Sample data instead of full queries for performance
    const sampleSize = Math.min(intervals.length, 30); // Limit to 30 data points max
    const sampledIntervals = intervals.filter((_, index) => 
      index % Math.ceil(intervals.length / sampleSize) === 0
    );

    const usersCollection = collection(db, "users");
    const activitiesCollection = collection(db, "activities");
    
    // Get approximate counts for time series
    const [usersData, activitiesData] = await Promise.all([
      getDocs(query(
        usersCollection,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        orderBy("createdAt", "asc"),
        limit(100) // Sample limit for performance
      )),
      getDocs(query(
        activitiesCollection,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        orderBy("createdAt", "asc"),
        limit(100) // Sample limit for performance
      ))
    ]);

    // Process sampled data into time series
    return sampledIntervals.map(interval => ({
      date: this.formatDate(interval, period),
      users: usersData.docs.filter(doc => {
        const date = safeToDate(doc.data().createdAt);
        return date && date <= interval;
      }).length,
      activities: activitiesData.docs.filter(doc => {
        const date = safeToDate(doc.data().createdAt);
        return date && date <= interval;
      }).length
    }));
  },

  // Optimized location popularity with better queries
  async getOptimizedLocationPopularityData(): Promise<PieChartData[]> {
    const activitiesCollection = collection(db, "activities");
    const locationsCollection = collection(db, "locations");
    
    // Get sample of activities for popularity calculation
    const [activitySnapshot, locationSnapshot] = await Promise.all([
      getDocs(query(activitiesCollection, limit(200))), // Sample instead of all
      getDocs(query(locationsCollection))
    ]);
    
    const locationMap = new Map<string, string>();
    locationSnapshot.forEach(doc => {
      locationMap.set(doc.id, doc.data().name);
    });
    
    const locationCounts = new Map<string, number>();
    
    activitySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.locations && Array.isArray(data.locations)) {
        data.locations.forEach((locationId: string) => {
          locationCounts.set(locationId, (locationCounts.get(locationId) || 0) + 1);
        });
      }
    });
    
    return Array.from(locationCounts.entries())
      .map(([locationId, count]) => ({
        name: locationMap.get(locationId) || 'Unknown',
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  },

  // Optimized recent activity
  async getOptimizedRecentActivity(limitCount: number = 5): Promise<any[]> {
    const [recentUsers, recentActivities] = await Promise.all([
      getDocs(query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )),
      getDocs(query(
        collection(db, "activities"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      ))
    ]);

    const users = recentUsers.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt) || new Date(),
      type: 'user'
    }));

    const activities = recentActivities.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt) || new Date(),
      type: 'activity'
    }));

    return [...users, ...activities]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limitCount);
  },

  // Optimized locations fetch
  async getOptimizedLocations(): Promise<any[]> {
    const snapshot = await getDocs(query(
      collection(db, "locations"),
      limit(50) // Limit for map performance
    ));
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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
        startDate = new Date(2020, 0, 1);
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
        while (current <= now) {
          intervals.push(new Date(current));
          current.setHours(current.getHours() + 1);
        }
        break;
      case 'week':
        while (current <= now) {
          intervals.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        break;
      case 'month':
        while (current <= now) {
          intervals.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        break;
      case 'year':
        while (current <= now) {
          intervals.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
        break;
      case 'all':
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
  },

  // Clear cache manually if needed
  clearCache(): void {
    dashboardCache.clear();
  }
}; 
