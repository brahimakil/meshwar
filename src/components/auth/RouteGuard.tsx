"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { currentUser, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("RouteGuard - pathname:", pathname);
    console.log("RouteGuard - currentUser:", !!currentUser);
    console.log("RouteGuard - loading:", loading);
    
    if (loading) return;

    // Public routes that don't require authentication (with and without trailing slashes)
    const publicRoutes = ['/login', '/login/', '/signup', '/signup/', '/forgot-password', '/forgot-password/'];
    
    // Check if the current route is a public route
    const isPublicRoute = publicRoutes.includes(pathname);
    
    console.log("RouteGuard - isPublicRoute:", isPublicRoute);

    if (!currentUser && !isPublicRoute) {
      console.log("RouteGuard - Redirecting to login (no user, protected route)");
      router.push('/login');
    } else if (currentUser && (pathname === '/login' || pathname === '/login/')) {
      console.log("RouteGuard - Redirecting to dashboard (user logged in, on login page)");
      router.push('/dashboard');
    }

    // For admin-only routes
    if (pathname.startsWith('/admin') && !isAdmin) {
      console.log("RouteGuard - Redirecting to dashboard (not admin)");
      router.push('/dashboard');
    }

  }, [currentUser, loading, pathname, router, isAdmin]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 