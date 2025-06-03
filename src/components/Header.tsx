"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, userData, logout } = useAuth();
  
  // Mock notifications for design purposes
  const notifications = [
    { id: 1, message: "New booking request", time: "5 min ago" },
    { id: 2, message: "New user registered", time: "1 hour ago" },
    { id: 3, message: "System update completed", time: "2 hours ago" }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 lg:pl-[calc(70px+1rem)] xl:pl-[calc(250px+1rem)]">
      <div className="flex flex-1 items-center gap-4 md:gap-6 lg:gap-8">
        {/* Search bar */}
        <div className="relative hidden md:flex flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (showUserMenu) setShowUserMenu(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-background hover:bg-muted"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-md border bg-background shadow-lg">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map(notification => (
                    <div key={notification.id} className="p-3 border-b hover:bg-muted">
                      <div className="text-sm">{notification.message}</div>
                      <div className="text-xs text-muted-foreground">{notification.time}</div>
                    </div>
                  ))}
                </div>
                <div className="p-2 text-center border-t">
                  <Link href="/notifications" className="text-xs text-primary hover:underline">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                if (showNotifications) setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-full hover:bg-muted p-1.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">
                  {userData?.displayName || currentUser?.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {userData?.role === "admin" ? "Administrator" : "User"}
                </div>
              </div>
            </button>
            
            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg">
                <div className="p-2">
                  <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="h-px my-1 bg-border"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}