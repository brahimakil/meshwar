"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Tag,
  Dumbbell,
  DollarSign,
  Loader2
} from "lucide-react";
import { activityService } from "@/services/activityService";
import { bookingService } from "@/services/bookingService";
import { Activity } from "@/types/activity";
import { Booking } from "@/types/booking";
import { formatDate } from "@/utils/dateUtils";
import { generateActivityReport } from "@/utils/reportUtils";

interface ActivityReportSectionProps {
  setError: (error: string | null) => void;
}

export default function ActivityReportSection({ setError }: ActivityReportSectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityBookings, setActivityBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const data = await activityService.getActivities();
        setActivities(data);
      } catch (err) {
        console.error("Error loading activities:", err);
        setError("Failed to load activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
  }, [setError]);

  const handleSelectActivity = async (activity: Activity) => {
    setSelectedActivity(activity);
    setLoading(true);
    
    try {
      const bookings = await bookingService.getBookingsByActivity(activity.id);
      setActivityBookings(bookings);
    } catch (err) {
      console.error("Error loading activity bookings:", err);
      setError("Failed to load activity bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedActivity) return;
    
    setGenerating(true);
    try {
      await generateActivityReport(selectedActivity, activityBookings);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const filteredActivities = activities.filter(activity => 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Selection */}
        <div className="md:col-span-1 border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-4">Select Activity</h2>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No activities found
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div
                  key={activity.id}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedActivity?.id === activity.id 
                      ? "border-primary bg-primary/10" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleSelectActivity(activity)}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{activity.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(activity.startDate)}</span>
                  </div>
                  <div className="text-xs mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Activity Details and Report Generation */}
        <div className="md:col-span-2 border rounded-lg p-4 bg-card">
          {selectedActivity ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-medium">{selectedActivity.title}</h2>
                  <p className="text-muted-foreground">
                    {formatDate(selectedActivity.startDate)} - {formatDate(selectedActivity.endDate)}
                  </p>
                </div>
                
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
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
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Activity Details</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Date: {formatDate(selectedActivity.startDate)} - {formatDate(selectedActivity.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Time: {selectedActivity.startTime} - {selectedActivity.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Locations: {
                          selectedActivity.locationObjects && selectedActivity.locationObjects.length > 0 
                            ? selectedActivity.locationObjects.map(loc => loc.name).join(", ") 
                            : selectedActivity.locations && selectedActivity.locations.length > 0
                              ? `${selectedActivity.locations.length} location(s) (details not loaded)`
                              : "N/A"
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Difficulty: {selectedActivity.difficulty.charAt(0).toUpperCase() + selectedActivity.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Age Group: {selectedActivity.ageGroup.charAt(0).toUpperCase() + selectedActivity.ageGroup.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Estimated Cost: ${selectedActivity.estimatedCost}
                      </span>
                    </div>
                    {selectedActivity.tags && selectedActivity.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Tags: {selectedActivity.tags.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Booking Statistics</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Participants:</span>
                      <span className="font-medium">{activityBookings.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confirmed Participants:</span>
                      <span className="font-medium">
                        {activityBookings.filter(b => b.status === "confirmed").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending Participants:</span>
                      <span className="font-medium">
                        {activityBookings.filter(b => b.status === "pending").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cancelled Participants:</span>
                      <span className="font-medium">
                        {activityBookings.filter(b => b.status === "cancelled").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Capacity Used:</span>
                      <span className="font-medium">
                        {selectedActivity.participantLimit > 0 
                          ? `${Math.round((activityBookings.length / selectedActivity.participantLimit) * 100)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Participant List</h3>
                
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : activityBookings.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted">
                    <p className="text-muted-foreground">No participants found for this activity</p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Booking Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {activityBookings.map(booking => (
                          <tr key={booking.id}>
                            <td className="px-4 py-3 text-sm">
                              {booking.userObject?.displayName || "Unknown User"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {booking.userObject?.email || "No email"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === "confirmed" 
                                  ? "bg-green-100 text-green-800" 
                                  : booking.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(booking.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <FileText className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium">Select an Activity</h3>
              <p className="text-muted-foreground mt-1">
                Choose an activity from the list to view details and generate a report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}