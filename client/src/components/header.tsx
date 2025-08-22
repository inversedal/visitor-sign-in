import { Building } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onAdminClick?: () => void;
  isAdmin?: boolean;
}

export default function Header({ onAdminClick, isAdmin }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      setLocation("/");
      toast({
        title: "Logged out",
        description: "Successfully logged out from admin panel",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const timeString = currentTime.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sign In
              </h1>
              <p className="text-sm text-gray-600">
                {isAdmin ? "Admin Dashboard" : "Welcome to our office"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {timeString}
            </span>
            {isAdmin ? (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="text-primary border-primary hover:bg-primary hover:text-white"
                >
                  Back to Public View
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onAdminClick}
                className="text-primary border-primary hover:bg-primary hover:text-white"
              >
                Admin Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
