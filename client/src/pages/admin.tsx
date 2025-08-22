import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Header from "@/components/header";
import AdminDashboard from "@/components/admin-dashboard";

export default function Admin() {
  const [, setLocation] = useLocation();
  
  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/admin/session"],
  });

  useEffect(() => {
    if (!isLoading && !session?.authenticated) {
      setLocation("/");
    }
  }, [session, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin />
      <AdminDashboard />
    </div>
  );
}
