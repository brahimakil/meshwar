'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Activity 
} from "lucide-react";
import dynamic from "next/dynamic";

import MainLayout from "@/layouts/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import LineChart from "@/components/dashboard/LineChart";
import PieChart from "@/components/dashboard/PieChart";
import TimeRangeSelector from "@/components/dashboard/TimeRangeSelector";
import ActivityItem from "@/components/dashboard/ActivityItem";
import { 
  dashboardService, 
  TimePeriod, 
  DashboardStats, 
  TimeSeriesData, 
  PieChartData 
} from "@/services/dashboardService";
import { getAgeGroupLabel } from "@/utils/ageGroupUtils";
import { locationService } from "@/services/locationService";
import { Location as LocationType } from "@/types/location";

// Define a type for recent activity items
interface RecentActivityItem {
  id: string;
  type: 'user' | 'activity' | 'location'; // Corrected type to match ActivityItemProps
  displayName?: string; // For type 'user'
  email?: string;       // For type 'user'
  title?: string;       // For type 'activity' or 'location'
  name?: string;        // Alternative for title, or other uses
  createdAt: Date;      // Ensuring createdAt is consistently a Date object
  // Add any other properties that might exist on the item
}

// Dynamically import the DashboardMap to avoid SSR issues with Leaflet
const DashboardMap = dynamic(
  () => import("@/components/maps/DashboardMap"),
  { ssr: false }
);

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [locationData, setLocationData] = useState<PieChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locations, setLocations] = useState<LocationType[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        console.log("Fetching dashboard data for period:", timePeriod);
        
        let statsData, timeSeriesResult, locationPopularityResult, recentActivityResult, locationsResult;
        
        try {
          statsData = await dashboardService.getDashboardStats(timePeriod);
          console.log("Stats data:", statsData);
        } catch (err) {
          console.error("Error fetching stats:", err);
        }
        
        try {
          timeSeriesResult = await dashboardService.getTimeSeriesData(timePeriod);
          console.log("Time series data:", timeSeriesResult);
        } catch (err) {
          console.error("Error fetching time series:", err);
        }
        
        try {
          locationPopularityResult = await dashboardService.getLocationPopularityData();
          console.log("Location data:", locationPopularityResult);
        } catch (err) {
          console.error("Error fetching location data:", err);
        }
        
        try {
          recentActivityResult = await dashboardService.getRecentActivity(5);
          console.log("Recent activity data:", recentActivityResult);
        } catch (err) {
          console.error("Error fetching recent activity:", err);
        }
        
        try {
          locationsResult = await locationService.getLocations();
          console.log("Locations data:", locationsResult);
          setLocations(locationsResult);
        } catch (err) {
          console.error("Error fetching locations:", err);
        }
        
        if (statsData) setStats(statsData);
        if (timeSeriesResult) setTimeSeriesData(timeSeriesResult);
        if (locationPopularityResult) setLocationData(locationPopularityResult);
        if (recentActivityResult) {
          setRecentActivity(recentActivityResult.map(item => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          })) as RecentActivityItem[]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [timePeriod]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s an overview of your platform.
            </p>
          </div>
          <TimeRangeSelector value={timePeriod} onChange={setTimePeriod} />
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard 
            title="Total Users" 
            value={loading ? "Loading..." : stats?.totalUsers || 0} 
            icon={Users}
            trend={stats ? { value: Math.round(stats.userGrowth), isPositive: stats.userGrowth >= 0 } : undefined}
            iconClassName="bg-blue-500"
          />
          <StatCard 
            title="Total Locations" 
            value={loading ? "Loading..." : stats?.totalLocations || 0} 
            icon={MapPin}
            trend={stats ? { value: Math.round(stats.locationGrowth), isPositive: stats.locationGrowth >= 0 } : undefined}
            iconClassName="bg-orange-500"
          />
          <StatCard 
            title="Total Activities" 
            value={loading ? "Loading..." : stats?.totalActivities || 0} 
            icon={Calendar}
            trend={stats ? { value: Math.round(stats.activityGrowth), isPositive: stats.activityGrowth >= 0 } : undefined}
            iconClassName="bg-green-500"
          />
          <StatCard 
            title="Active Activities" 
            value={loading ? "Loading..." : stats?.activeActivities || 0} 
            icon={DollarSign}
            iconClassName="bg-purple-500"
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bookings Overview */}
          <div className="col-span-2 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Activity Overview</h3>
            </div>
            <div className="mt-4 h-[300px] w-full border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : timeSeriesData.length > 0 ? (
                <LineChart 
                  data={timeSeriesData} 
                  title={`Activity over ${timePeriod === 'day' ? 'today' : 
                          timePeriod === 'week' ? 'the last 7 days' : 
                          timePeriod === 'month' ? 'the last 30 days' : 
                          timePeriod === 'year' ? 'the last 12 months' : 'all time'}`} 
                />
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Activity className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No data available for this time period</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Popular Locations */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-medium">Popular Locations</h3>
            <div className="mt-4 h-[300px] w-full border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : locationData.length > 0 ? (
                <PieChart data={locationData} title="Top Locations" />
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <MapPin className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No data available for this time period</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Map and Recent Activity Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Map */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-medium">Location Map</h3>
            <div className="mt-4 h-[300px] w-full border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : locations.length > 0 ? (
                <DashboardMap locations={locations} />
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <MapPin className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No locations available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            <div className="mt-4 space-y-4 border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {recentActivity.map((item) => (
                    <ActivityItem
                      key={item.id}
                      id={item.id}
                      type={item.type}
                      description={item.type === 'user' ? item.displayName || item.email || 'N/A' : item.title || item.name || 'N/A'}
                      createdAt={item.createdAt}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-[300px]">
                  <Activity className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Activity by Difficulty */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-medium">Activities by Difficulty</h3>
            <div className="mt-4 space-y-4 border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {['Easy', 'Moderate', 'Challenging'].map((difficulty) => {
                    // Count activities by difficulty
                    const count = stats?.activitiesByDifficulty?.[difficulty.toLowerCase()] || 0;
                    const percentage = stats?.totalActivities 
                      ? Math.round((count / stats.totalActivities) * 100) 
                      : 0;
                    
                    return (
                      <div key={difficulty} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{difficulty}</span>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              difficulty === 'Easy' ? 'bg-green-500' : 
                              difficulty === 'Moderate' ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Activities by Age Group */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-medium">Activities by Age Group</h3>
            <div className="mt-4 space-y-4 border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats?.activitiesByAgeGroup || {}).map(([key, count]) => {
                    const displayName = getAgeGroupLabel(key);
                    
                    const percentage = stats?.totalActivities 
                      ? Math.round((count / stats.totalActivities) * 100) 
                      : 0;
                    
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{displayName}</span>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Activities */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-medium">Upcoming Activities</h3>
            <div className="mt-4 space-y-4 border-t pt-4">
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : stats?.upcomingActivities && stats.upcomingActivities.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {stats.upcomingActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-2 border-b last:border-0 last:pb-0">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-[200px]">
                  <Calendar className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No upcoming activities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 