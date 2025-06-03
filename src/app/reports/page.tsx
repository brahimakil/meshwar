"use client";

import { useState } from "react";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  AlertCircle
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import ReportTypeCard from "@/components/reports/ReportTypeCard";
import UserReportSection from "@/components/reports/UserReportSection";
import ActivityReportSection from "@/components/reports/ActivityReportSection";
import AdminReportSection from "@/components/reports/AdminReportSection";

type ReportType = "user" | "activity" | "admin";

export default function ReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectReportType = (type: ReportType) => {
    setSelectedReportType(type);
    setError(null);
  };

  const handleBack = () => {
    setSelectedReportType(null);
    setError(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate detailed reports and analytics
            </p>
          </div>
          
          {selectedReportType && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
            >
              Back to Report Types
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        
        {!selectedReportType ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReportTypeCard
              title="User Reports"
              description="Generate detailed reports for individual users, including their activities and bookings."
              icon={Users}
              onClick={() => handleSelectReportType("user")}
            />
            
            <ReportTypeCard
              title="Activity Reports"
              description="Generate reports for activities, including participant information and statistics."
              icon={Calendar}
              onClick={() => handleSelectReportType("activity")}
            />
            
            <ReportTypeCard
              title="Admin Analytics Report"
              description="Comprehensive data analysis of the entire platform, including users, activities, locations, and bookings."
              icon={BarChart3}
              onClick={() => handleSelectReportType("admin")}
            />
          </div>
        ) : selectedReportType === "user" ? (
          <UserReportSection setError={setError} />
        ) : selectedReportType === "activity" ? (
          <ActivityReportSection setError={setError} />
        ) : (
          <AdminReportSection setError={setError} />
        )}
      </div>
    </MainLayout>
  );
} 