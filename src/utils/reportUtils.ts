import { User } from "@/types/user";
import { Activity } from "@/types/activity";
import { Booking } from "@/types/booking";
import { Location } from "@/types/location";
import { formatDate } from "./dateUtils";

interface AdminReportData {
  users: User[];
  activities: Activity[];
  locations: Location[];
  bookings: Booking[];
  stats: any;
  charts: any;
}

// Generate a user report with their bookings
export async function generateUserReport(user: User, bookings: Booking[]) {
  try {
    // Create report content
    let reportContent = `
      # User Report: ${user.displayName || user.email}
      Generated on: ${formatDate(new Date())}
      
      ## User Information
      - Name: ${user.displayName || "N/A"}
      - Email: ${user.email || "N/A"}
      - Role: ${user.role || "N/A"}
      - Age: ${user.dob ? calculateAge(user.dob) : "N/A"}
      - Account Created: ${formatDate(user.createdAt)}
      
      ## Booking Summary
      - Total Bookings: ${bookings.length}
      - Confirmed Bookings: ${bookings.filter(b => b.status === "confirmed").length}
      - Pending Bookings: ${bookings.filter(b => b.status === "pending").length}
      - Cancelled Bookings: ${bookings.filter(b => b.status === "cancelled").length}
      
      ## Booking Details
    `;
    
    if (bookings.length === 0) {
      reportContent += "\nNo bookings found for this user.";
    } else {
      bookings.forEach((booking, index) => {
        reportContent += `
        ### Booking ${index + 1}
        - Activity: ${booking.activityObject?.title || "Unknown Activity"}
        - Date: ${booking.activityObject?.startDate ? formatDate(booking.activityObject.startDate) : "N/A"}
        - Time: ${booking.activityObject?.startTime || "N/A"}
        - Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        - Locations: ${booking.activityObject?.locationObjects?.map(loc => loc.name).join(", ") || "N/A"}
        - Booked on: ${formatDate(booking.createdAt)}
        `;
      });
    }
    
    // Convert to Blob
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_report_${user.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error generating user report:", error);
    throw error;
  }
}

// Generate an activity report with its bookings
export async function generateActivityReport(activity: Activity, bookings: Booking[]) {
  try {
    // Create report content
    let reportContent = `
      # Activity Report: ${activity.title}
      Generated on: ${formatDate(new Date())}
      
      ## Activity Information
      - Title: ${activity.title}
      - Date: ${formatDate(activity.startDate)} - ${formatDate(activity.endDate)}
      - Time: ${activity.startTime} - ${activity.endTime}
      - Locations: ${activity.locationObjects?.map(loc => loc.name).join(", ") || "N/A"}
      - Difficulty: ${activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
      - Age Group: ${activity.ageGroup.charAt(0).toUpperCase() + activity.ageGroup.slice(1)}
      - Estimated Cost: $${activity.estimatedCost}
      - Estimated Duration: ${activity.estimatedDuration} minutes
      - Status: ${activity.isExpired ? "Expired" : activity.isActive ? "Active" : "Inactive"}
      - Participant Limit: ${activity.participantLimit || "Unlimited"}
      - Current Participants: ${activity.currentParticipants || 0}
      - Tags: ${activity.tags?.join(", ") || "None"}
      
      ## Booking Summary
      - Total Participants: ${bookings.length}
      - Confirmed Participants: ${bookings.filter(b => b.status === "confirmed").length}
      - Pending Participants: ${bookings.filter(b => b.status === "pending").length}
      - Cancelled Participants: ${bookings.filter(b => b.status === "cancelled").length}
      - Capacity Utilization: ${activity.participantLimit 
          ? `${Math.round((bookings.length / activity.participantLimit) * 100)}%` 
          : "N/A"}
      
      ## Participant Details
    `;
    
    if (bookings.length === 0) {
      reportContent += "\nNo participants found for this activity.";
    } else {
      bookings.forEach((booking, index) => {
        reportContent += `
        ### Participant ${index + 1}
        - Name: ${booking.userObject?.displayName || "Unknown User"}
        - Email: ${booking.userObject?.email || "N/A"}
        - Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        - Booked on: ${formatDate(booking.createdAt)}
        `;
      });
    }
    
    // Convert to Blob
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_report_${activity.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error generating activity report:", error);
    throw error;
  }
}

// Generate a comprehensive admin report
export async function generateAdminReport(data: AdminReportData) {
  try {
    const { users, activities, locations, bookings, stats, charts } = data;
    
    // Create report content
    let reportContent = `
      # Administrative Data Analysis Report
      Generated on: ${formatDate(new Date())}
      
      ## Executive Summary
      This report provides a comprehensive analysis of all data in the platform, including users, activities, locations, and bookings.
      
      ## Key Statistics
      - Total Users: ${stats.totalUsers}
      - Total Activities: ${stats.totalActivities}
      - Total Locations: ${stats.totalLocations}
      - Total Bookings: ${stats.totalBookings}
      
      ## Activity Analysis
      - Active Activities: ${stats.activeActivities}
      - Completed Activities: ${stats.completedActivities}
      - Average Participants Per Activity: ${stats.averageParticipantsPerActivity}
      - Most Popular Activity: ${stats.mostPopularActivity}
      
      ## Booking Analysis
      - Confirmed Bookings: ${stats.confirmedBookings}
      - Pending Bookings: ${stats.pendingBookings}
      - Cancelled Bookings: ${stats.cancelledBookings}
      - Booking Confirmation Rate: ${stats.totalBookings > 0 
          ? `${Math.round((stats.confirmedBookings / stats.totalBookings) * 100)}%` 
          : "N/A"}
      
      ## User Analysis
      - Most Active User: ${stats.mostActiveUser}
      
      ## Activities by Difficulty
    `;
    
    // Add activities by difficulty
    if (charts.activityByDifficulty) {
      Object.entries(charts.activityByDifficulty).forEach(([difficulty, count]) => {
        const percentage = activities.length > 0 
          ? Math.round((Number(count) / activities.length) * 100) 
          : 0;
        reportContent += `\n      - ${difficulty}: ${count} (${percentage}%)`;
      });
    }
    
    reportContent += `\n\n      ## Activities by Age Group`;
    
    // Add activities by age group
    if (charts.activityByAgeGroup) {
      Object.entries(charts.activityByAgeGroup).forEach(([ageGroup, count]) => {
        const percentage = activities.length > 0 
          ? Math.round((Number(count) / activities.length) * 100) 
          : 0;
        reportContent += `\n      - ${ageGroup}: ${count} (${percentage}%)`;
      });
    }
    
    reportContent += `\n\n      ## Locations by Category`;
    
    // Add locations by category
    if (charts.locationsByCategory) {
      Object.entries(charts.locationsByCategory).forEach(([category, count]) => {
        const percentage = locations.length > 0 
          ? Math.round((Number(count) / locations.length) * 100) 
          : 0;
        reportContent += `\n      - ${category}: ${count} (${percentage}%)`;
      });
    }
    
    reportContent += `\n\n      ## Recent Activities`;
    
    // Add recent activities
    activities.slice(0, 10).forEach((activity, index) => {
      reportContent += `\n      ${index + 1}. ${activity.title} - ${formatDate(activity.startDate)} (${
        activity.isExpired ? "Expired" : activity.isActive ? "Active" : "Inactive"
      })`;
    });
    
    reportContent += `\n\n      ## All Users`;
    
    // Add users (non-admin)
    users.filter(user => user.role === "user").forEach((user, index) => {
      reportContent += `\n      ${index + 1}. ${user.displayName || user.email} - Joined: ${formatDate(user.createdAt)}`;
    });
    
    reportContent += `\n\n      ## All Locations`;
    
    // Add locations
    locations.forEach((location, index) => {
      reportContent += `\n      ${index + 1}. ${location.name} - ${location.category || "No category"} - ${
        location.isActive ? "Active" : "Inactive"
      }`;
    });
    
    // Convert to Blob
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error generating admin report:", error);
    throw error;
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dob: Date | any): number {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
} 