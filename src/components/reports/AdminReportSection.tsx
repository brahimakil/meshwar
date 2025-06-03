"use client";

import { useState, useEffect } from "react";
import { 
  Download, 
  Loader2, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Map,
  Users,
  Calendar,
  MapPin,
  Clock,
  AlertCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import { userService } from "@/services/userService";
import { activityService } from "@/services/activityService";
import { locationService } from "@/services/locationService";
import { bookingService } from "@/services/bookingService";
import { User } from "@/types/user";
import { Activity } from "@/types/activity";
import { Location } from "@/types/location";
import { Booking } from "@/types/booking";
import { formatDate } from "@/utils/dateUtils";
import { generateAdminReport } from "@/utils/reportUtils";

// Dynamically import chart components to avoid SSR issues
const LineChart = dynamic(() => import("@/components/dashboard/LineChart"), { ssr: false });
const PieChartComponent = dynamic(() => import("@/components/reports/PieChart"), { ssr: false });
const BarChartComponent = dynamic(() => import("@/components/reports/BarChart"), { ssr: false });

// Dynamically import map component to avoid SSR issues
const ReportMap = dynamic(() => import("@/components/maps/ReportMap"), { ssr: false });

interface AdminReportSectionProps {
  setError: (error: string | null) => void;
}

interface StatsData {
  totalUsers: number;
  totalActivities: number;
  totalLocations: number;
  totalBookings: number;
  activeActivities: number;
  completedActivities: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  averageParticipantsPerActivity: number;
  mostPopularActivity: string;
  mostActiveUser: string;
}

interface ChartData {
  activityByDifficulty: Record<string, number>;
  activityByAgeGroup: Record<string, number>;
  bookingsByMonth: Record<string, number>;
  userRegistrationsByMonth: Record<string, number>;
  locationsByCategory: Record<string, number>;
}

export default function AdminReportSection({ setError }: AdminReportSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load all data in parallel
        const [usersData, activitiesData, locationsData, bookingsData] = await Promise.all([
          userService.getUsers(),
          activityService.getActivities(),
          locationService.getLocations(),
          bookingService.getBookings()
        ]);
        
        setUsers(usersData);
        setActivities(activitiesData);
        setLocations(locationsData);
        setBookings(bookingsData);
        
        // Calculate statistics
        calculateStats(usersData, activitiesData, locationsData, bookingsData);
        
        // Calculate chart data
        calculateChartData(usersData, activitiesData, locationsData, bookingsData, timeframe);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load report data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [setError, timeframe]);

  const calculateStats = (
    users: User[], 
    activities: Activity[], 
    locations: Location[], 
    bookings: Booking[]
  ) => {
    // Filter active users (non-admins)
    const activeUsers = users.filter(user => user.role === "user");
    
    // Filter active and completed activities
    const activeActs = activities.filter(activity => activity.isActive && !activity.isExpired);
    const completedActs = activities.filter(activity => activity.isExpired);
    
    // Count bookings by status
    const confirmedBookings = bookings.filter(booking => booking.status === "confirmed");
    const pendingBookings = bookings.filter(booking => booking.status === "pending");
    const cancelledBookings = bookings.filter(booking => booking.status === "cancelled");
    
    // Calculate average participants per activity
    const activitiesWithBookings = activities.filter(activity => 
      bookings.some(booking => booking.activityId === activity.id)
    );
    
    const averageParticipants = activitiesWithBookings.length > 0 
      ? bookings.length / activitiesWithBookings.length 
      : 0;
    
    // Find most popular activity
    const activityBookingCounts = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      count: bookings.filter(booking => booking.activityId === activity.id).length
    }));
    
    const mostPopularActivity = activityBookingCounts.length > 0
      ? activityBookingCounts.reduce((max, activity) => 
          activity.count > max.count ? activity : max, 
          { id: '', title: 'None', count: 0 }
        ).title
      : 'None';
    
    // Find most active user
    const userBookingCounts = activeUsers.map(user => ({
      id: user.id,
      name: user.displayName || user.email || 'Unknown',
      count: bookings.filter(booking => booking.userId === user.id).length
    }));
    
    const mostActiveUser = userBookingCounts.length > 0
      ? userBookingCounts.reduce((max, user) => 
          user.count > max.count ? user : max, 
          { id: '', name: 'None', count: 0 }
        ).name
      : 'None';
    
    setStatsData({
      totalUsers: activeUsers.length,
      totalActivities: activities.length,
      totalLocations: locations.length,
      totalBookings: bookings.length,
      activeActivities: activeActs.length,
      completedActivities: completedActs.length,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
      cancelledBookings: cancelledBookings.length,
      averageParticipantsPerActivity: parseFloat(averageParticipants.toFixed(2)),
      mostPopularActivity,
      mostActiveUser
    });
  };

  const calculateChartData = (
    users: User[], 
    activities: Activity[], 
    locations: Location[], 
    bookings: Booking[],
    timeframe: 'month' | 'quarter' | 'year'
  ) => {
    // Calculate activities by difficulty
    const activityByDifficulty = activities.reduce((acc, activity) => {
      const difficulty = activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1);
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate activities by age group
    const activityByAgeGroup = activities.reduce((acc, activity) => {
      const ageGroup = activity.ageGroup.charAt(0).toUpperCase() + activity.ageGroup.slice(1);
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate bookings by month/quarter/year
    const bookingsByTime = bookings.reduce((acc, booking) => {
      const date = new Date(booking.createdAt);
      let timeKey: string;
      
      if (timeframe === 'month') {
        timeKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      } else if (timeframe === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        timeKey = `Q${quarter} ${date.getFullYear()}`;
      } else {
        timeKey = date.getFullYear().toString();
      }
      
      acc[timeKey] = (acc[timeKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate user registrations by month/quarter/year
    const userRegistrationsByTime = users.reduce((acc, user) => {
      const date = new Date(user.createdAt);
      let timeKey: string;
      
      if (timeframe === 'month') {
        timeKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      } else if (timeframe === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        timeKey = `Q${quarter} ${date.getFullYear()}`;
      } else {
        timeKey = date.getFullYear().toString();
      }
      
      acc[timeKey] = (acc[timeKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate locations by category
    const locationsByCategory = locations.reduce((acc, location) => {
      if (location.category && typeof location.category === 'string') {
        const category = location.category.charAt(0).toUpperCase() + location.category.slice(1);
        acc[category] = (acc[category] || 0) + 1;
      } else {
        // Handle locations without a category or with non-string category
        acc["Uncategorized"] = (acc["Uncategorized"] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    setChartData({
      activityByDifficulty,
      activityByAgeGroup,
      bookingsByMonth: bookingsByTime,
      userRegistrationsByMonth: userRegistrationsByTime,
      locationsByCategory
    });
  };

  const handleGenerateReport = async () => {
    if (!statsData || !chartData) return;
    
    setGenerating(true);
    try {
      await generateAdminReport({
        users,
        activities,
        locations,
        bookings,
        stats: statsData,
        charts: chartData
      });
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleTimeframeChange = (newTimeframe: 'month' | 'quarter' | 'year') => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Admin Analytics Report</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Timeframe:</span>
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${
                  timeframe === 'month' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleTimeframeChange('month')}
              >
                Monthly
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  timeframe === 'quarter' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleTimeframeChange('quarter')}
              >
                Quarterly
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  timeframe === 'year' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleTimeframeChange('year')}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={generating || loading || !statsData}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Generate Full Report</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Key Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{statsData?.totalUsers || 0}</p>
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Total Activities</h3>
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{statsData?.totalActivities || 0}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">Active: {statsData?.activeActivities || 0}</span>
                <span className="text-muted-foreground">Completed: {statsData?.completedActivities || 0}</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Total Locations</h3>
                <MapPin className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{statsData?.totalLocations || 0}</p>
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Total Bookings</h3>
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{statsData?.totalBookings || 0}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-green-500">Confirmed: {statsData?.confirmedBookings || 0}</span>
                <span className="text-yellow-500">Pending: {statsData?.pendingBookings || 0}</span>
                <span className="text-red-500">Cancelled: {statsData?.cancelledBookings || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Advanced Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Key Insights</h3>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Average Participants Per Activity</p>
                  <p className="text-lg font-medium">{statsData?.averageParticipantsPerActivity || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Most Popular Activity</p>
                  <p className="text-lg font-medium">{statsData?.mostPopularActivity || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Most Active User</p>
                  <p className="text-lg font-medium">{statsData?.mostActiveUser || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Confirmation Rate</p>
                  <p className="text-lg font-medium">
                    {statsData && statsData.totalBookings > 0
                      ? `${Math.round((statsData.confirmedBookings / statsData.totalBookings) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-card md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Bookings Over Time</h3>
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              
              {chartData && (
                <div className="h-64">
                  <LineChart 
                    title={`Bookings by ${timeframe === 'month' ? 'Month' : timeframe === 'quarter' ? 'Quarter' : 'Year'}`}
                    data={Object.entries(chartData.bookingsByMonth).map(([date, count]) => ({
                      date,
                      bookings: count
                    }))}
                    height={250}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Activities by Difficulty</h3>
                <PieChart className="h-4 w-4 text-primary" />
              </div>
              
              {chartData && (
                <div className="h-64">
                  <PieChartComponent 
                    data={Object.entries(chartData.activityByDifficulty).map(([label, value]) => ({ label, value }))}
                    height={250}
                  />
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Activities by Age Group</h3>
                <PieChart className="h-4 w-4 text-primary" />
              </div>
              
              {chartData && (
                <div className="h-64">
                  <PieChartComponent 
                    data={Object.entries(chartData.activityByAgeGroup).map(([label, value]) => ({ label, value }))}
                    height={250}
                  />
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">User Registrations</h3>
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              
              {chartData && (
                <div className="h-64">
                  <BarChartComponent 
                    data={Object.entries(chartData.userRegistrationsByMonth).map(([date, count]) => ({
                      label: date,
                      value: count
                    }))}
                    height={250}
                  />
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Locations by Category</h3>
                <PieChart className="h-4 w-4 text-primary" />
              </div>
              
              {chartData && (
                <div className="h-64">
                  <PieChartComponent 
                    data={Object.entries(chartData.locationsByCategory).map(([label, value]) => ({ label, value }))}
                    height={250}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Map Section */}
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Location Map</h3>
              <Map className="h-4 w-4 text-primary" />
            </div>
            
            <div className="h-[400px]">
              {locations.length > 0 && (
                <ReportMap locations={locations} activities={activities} />
              )}
            </div>
          </div>
          
          {/* Recent Activities Table */}
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Recent Activities</h3>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Start Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Participants</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activities.slice(0, 5).map(activity => (
                    <tr key={activity.id}>
                      <td className="px-4 py-3 text-sm">{activity.title}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(activity.startDate)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.isExpired 
                            ? "bg-gray-100 text-gray-800" 
                            : activity.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                        }`}>
                          {activity.isExpired 
                            ? "Expired" 
                            : activity.isActive 
                              ? "Active" 
                              : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {activity.currentParticipants || 0}/{activity.participantLimit || "∞"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 