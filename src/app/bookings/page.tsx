"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Booking } from "@/types/booking";
import { Activity } from "@/types/activity";
import { User as UserType } from "@/types/user";
import { bookingService } from "@/services/bookingService";
import { activityService } from "@/services/activityService";
import { userService } from "@/services/userService";
import { formatDate } from "@/utils/dateUtils";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    userId: "",
    activityId: "",
    status: "confirmed" as "confirmed" | "pending" | "cancelled"
  });

  const loadBookingsForActivity = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBookingsByActivity(activityId);
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.debug("[BookingsPage] Loading data...");
      
      const [activitiesData, usersData, bookingsData] = await Promise.all([
        activityService.getActivities(),
        userService.getUsers(),
        bookingService.getBookings()
      ]);
      
      // Debug: Log first item of each dataset
      if (activitiesData.length > 0) {
        console.debug("[BookingsPage] First activity:", {
          id: activitiesData[0].id,
          startDate: activitiesData[0].startDate,
          endDate: activitiesData[0].endDate,
          createdAt: activitiesData[0].createdAt,
          updatedAt: activitiesData[0].updatedAt
        });
      }
      
      if (usersData.length > 0) {
        console.debug("[BookingsPage] First user:", {
          id: usersData[0].id,
          dob: usersData[0].dob,
          createdAt: usersData[0].createdAt,
          updatedAt: usersData[0].updatedAt
        });
      }
      
      if (bookingsData.length > 0) {
        console.debug("[BookingsPage] First booking:", {
          id: bookingsData[0].id,
          createdAt: bookingsData[0].createdAt,
          updatedAt: bookingsData[0].updatedAt
        });
      }
      
      const activeActivities = activitiesData.filter(
        activity => !activity.isExpired && activity.isActive
      );
      
      const regularUsers = usersData.filter(user => user.role === "user");
      
      setActivities(activeActivities);
      setUsers(regularUsers);
      setBookings(bookingsData);
      
      if (activeActivities.length > 0) {
        const currentSelectedActivityIsValid = activeActivities.some(act => act.id === selectedActivity);
        if (selectedActivity && currentSelectedActivityIsValid) {
            loadBookingsForActivity(selectedActivity);
        } else if (activeActivities.length > 0) {
            setSelectedActivity(activeActivities[0].id);
            loadBookingsForActivity(activeActivities[0].id);
        }
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("[BookingsPage] Error loading data:", err);
      setError(`Failed to load data: ${err.message}. See console for details.`);
    } finally {
      setLoading(false);
    }
  }, [loadBookingsForActivity, selectedActivity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateBooking() {
    try {
      setLoading(true);
      setError(null);
      
      if (!newBooking.userId || !newBooking.activityId) {
        setError("Please select both a user and an activity");
        setLoading(false);
        return;
      }
      
      await bookingService.createBooking({
        userId: newBooking.userId,
        activityId: newBooking.activityId,
        status: newBooking.status
      });
      
      setNewBooking({
        userId: "",
        activityId: "",
        status: "confirmed"
      });
      setShowCreateModal(false);
      
      await loadBookingsForActivity(newBooking.activityId);
    } catch (err: unknown) {
      console.error("Error creating booking:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to create booking. Please try again.");
      } else {
        setError("Failed to create booking. An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    try {
      setLoading(true);
      setError(null);
      await bookingService.changeBookingStatus(bookingId, "cancelled");
      
      // Update the local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { ...booking, status: "cancelled" } : booking
        )
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking(bookingId: string) {
    try {
      setLoading(true);
      setError(null);
      await bookingService.changeBookingStatus(bookingId, "confirmed");
      
      // Update the local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { ...booking, status: "confirmed" } : booking
        )
      );
    } catch (err) {
      console.error("Error confirming booking:", err);
      setError("Failed to confirm booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    if (!window.confirm("Are you sure you want to delete this booking?")) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await bookingService.deleteBooking(bookingId);
      
      // Update the local state
      setBookings(prevBookings =>
        prevBookings.filter(booking => booking.id !== bookingId)
      );
    } catch (err) {
      console.error("Error deleting booking:", err);
      setError("Failed to delete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleActivityChange(activityId: string) {
    setSelectedActivity(activityId);
    loadBookingsForActivity(activityId);
  }

  const selectedActivityData = activities.find(a => a.id === selectedActivity);
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground">
              Manage activity bookings for users
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Booking</span>
          </button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activity Selector */}
          <div className="md:col-span-1 border rounded-lg p-4 bg-card">
            <h2 className="text-lg font-medium mb-4">Activities</h2>
            
            <div className="space-y-4">
              {loading && activities.length === 0 ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center p-4 border rounded-lg bg-muted">
                  <p className="text-muted-foreground">No active activities found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedActivity === activity.id 
                          ? "border-primary bg-primary/10" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleActivityChange(activity.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{activity.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {activity.currentParticipants || 0}/{activity.participantLimit || "∞"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(activity.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{activity.startTime} - {activity.endTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Bookings List */}
          <div className="md:col-span-2 border rounded-lg p-4 bg-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                {selectedActivityData ? `Bookings for ${selectedActivityData.title}` : "Bookings"}
              </h2>
              {selectedActivityData && (
                <span className="text-sm">
                  {selectedActivityData.currentParticipants || 0}/{selectedActivityData.participantLimit || "∞"} participants
                </span>
              )}
            </div>
            
            {loading && bookings.length === 0 ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !selectedActivity ? (
              <div className="text-center p-8 border rounded-lg bg-muted">
                <p className="text-muted-foreground">Please select an activity to view bookings.</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted">
                <p className="text-muted-foreground">No bookings found for this activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {booking.userObject?.displayName || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.userObject?.email}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "confirmed" 
                            ? "bg-green-100 text-green-800" 
                            : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      {booking.status !== "confirmed" && (
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Confirm</span>
                        </button>
                      )}
                      
                      {booking.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-md"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Booking</h2>
            
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Activity</label>
                <select
                  value={newBooking.activityId}
                  onChange={(e) => setNewBooking({...newBooking, activityId: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select an activity</option>
                  {activities.map((activity) => {
                    const isFull = activity.participantLimit > 0 && 
                                  (activity.currentParticipants || 0) >= activity.participantLimit;
                    return (
                      <option 
                        key={activity.id} 
                        value={activity.id}
                        disabled={isFull}
                      >
                        {activity.title} {isFull ? "(Full)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <div className="mb-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 p-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center p-2 text-sm text-muted-foreground">No users found</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-2 cursor-pointer hover:bg-muted ${
                          newBooking.userId === user.id ? "bg-primary/10" : ""
                        }`}
                        onClick={() => setNewBooking({...newBooking, userId: user.id})}
                      >
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newBooking.status}
                  onChange={(e) => setNewBooking({
                    ...newBooking, 
                    status: e.target.value as "confirmed" | "pending" | "cancelled"
                  })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-md"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Create Booking"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 