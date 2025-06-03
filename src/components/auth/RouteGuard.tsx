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
    if (loading) return;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/forgot-password'];
    
    // Check if the current route is a public route
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!currentUser && !isPublicRoute) {
      // Redirect to login if user is not authenticated and trying to access a protected route
      router.push('/login');
    } else if (currentUser && isPublicRoute) {
      // Redirect to dashboard if user is authenticated and trying to access a public route
      router.push('/dashboard');
    }

    // For admin-only routes
    if (pathname.startsWith('/admin') && !isAdmin) {
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