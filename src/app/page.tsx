"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // Redirect based on authentication status
    if (currentUser) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  // Return a simple loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Meshwar Admin</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
