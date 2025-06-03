"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Clock,
  Loader2
} from "lucide-react";
import { userService } from "@/services/userService";
import { bookingService } from "@/services/bookingService";
import { User as UserType } from "@/types/user";
import { Booking } from "@/types/booking";
import { formatDate } from "@/utils/dateUtils";
import { generateUserReport } from "@/utils/reportUtils";

interface UserReportSectionProps {
  setError: (error: string | null) => void;
}

export default function UserReportSection({ setError }: UserReportSectionProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await userService.getUsers();
        // Filter out admin users
        const filteredUsers = data.filter(user => user.role === "user");
        setUsers(filteredUsers);
      } catch (err) {
        console.error("Error loading users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [setError]);

  const handleSelectUser = async (user: UserType) => {
    setSelectedUser(user);
    setLoading(true);
    
    try {
      const bookings = await bookingService.getBookingsByUser(user.id);
      setUserBookings(bookings);
    } catch (err) {
      console.error("Error loading user bookings:", err);
      setError("Failed to load user bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedUser) return;
    
    setGenerating(true);
    try {
      await generateUserReport(selectedUser, userBookings);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Selection */}
        <div className="md:col-span-1 border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-4">Select User</h2>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
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
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedUser?.id === user.id 
                      ? "border-primary bg-primary/10" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.displayName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {user.email}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* User Details and Report Generation */}
        <div className="md:col-span-2 border rounded-lg p-4 bg-card">
          {selectedUser ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-medium">{selectedUser.displayName}</h2>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">User Information</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Name: {selectedUser.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email: {selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Age: {selectedUser.dob ? userService.calculateAge(selectedUser.dob) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined: {formatDate(selectedUser.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Booking Statistics</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Bookings:</span>
                      <span className="font-medium">{userBookings.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confirmed Bookings:</span>
                      <span className="font-medium">
                        {userBookings.filter(b => b.status === "confirmed").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending Bookings:</span>
                      <span className="font-medium">
                        {userBookings.filter(b => b.status === "pending").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cancelled Bookings:</span>
                      <span className="font-medium">
                        {userBookings.filter(b => b.status === "cancelled").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Booking History</h3>
                
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted">
                    <p className="text-muted-foreground">No bookings found for this user</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userBookings.map(booking => (
                      <div key={booking.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {booking.activityObject?.title || "Unknown Activity"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {booking.activityObject?.startDate && 
                               formatDate(booking.activityObject.startDate)}
                              {booking.activityObject?.startTime && 
                               ` at ${booking.activityObject.startTime}`}
                            </p>
                          </div>
                          
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
                        
                        {booking.activityObject?.locationObjects && booking.activityObject.locationObjects.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {booking.activityObject.locationObjects.map(loc => loc.name).join(", ")}
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          Booked on {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <FileText className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium">Select a User</h3>
              <p className="text-muted-foreground mt-1">
                Choose a user from the list to view details and generate a report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 