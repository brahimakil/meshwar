"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, userData, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the user's profile data when the component mounts or userData changes
    async function fetchUserProfile() {
      if (currentUser) {
        try {
          const user = await userService.getUserById(currentUser.uid);
          if (user && user.profileImage) {
            setProfileImage(user.profileImage);
          } else {
            setProfileImage(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfileImage(null);
        }
      }
    }

    fetchUserProfile();
  }, [currentUser, userData]);

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
        {/* Search bar removed */}
        
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications removed */}
          
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2 rounded-full hover:bg-muted p-1.5"
            >
              {/* User avatar - show profile image if available, otherwise show default icon */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary">
                {profileImage ? (
                  <Image 
                    src={profileImage} 
                    alt="Profile" 
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
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