import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CalendarCheck, Clock, Download, RefreshCw, Search, Eye, LogOut, User, Building2, Calendar, Mail, Camera } from "lucide-react";
import { type Visitor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<{
    currentVisitors: number;
    todaySignins: number;
    avgDuration: string;
  }>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: visitors = [], isLoading: visitorsLoading, error: visitorsError } = useQuery<Visitor[]>({
    queryKey: ["/api/admin/visitors"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch full visitor data with photo when selected
  const { data: fullVisitorData } = useQuery<Visitor>({
    queryKey: ["/api/admin/visitors", selectedVisitorId],
    enabled: !!selectedVisitorId,
  });

  const signOutMutation = useMutation({
    mutationFn: (visitorId: string) => apiRequest("POST", `/api/admin/visitors/${visitorId}/signout`),
    onSuccess: () => {
      toast({
        title: "Visitor signed out",
        description: "Visitor has been successfully signed out",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/visitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sign-out failed",
        description: error.message || "Failed to sign out visitor",
        variant: "destructive",
      });
    },
  });

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/admin/export", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `visitor-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Visitor data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentVisitors = visitors.filter((visitor: Visitor) => !visitor.isSignedOut);
  const filteredVisitors = currentVisitors.filter((visitor: Visitor) =>
    visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visitor.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visitor.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case "meeting": return "bg-blue-100 text-blue-800";
      case "interview": return "bg-green-100 text-green-800";
      case "delivery": return "bg-purple-100 text-purple-800";
      case "maintenance": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (statsLoading || visitorsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (statsError || visitorsError) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
              <p className="text-gray-600 mb-4">
                {statsError?.message || visitorsError?.message || "Failed to load dashboard data"}
              </p>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/visitors"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                }}
                className="btn-primary"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600">Manage visitor records and settings</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleExportData}
              className="btn-success"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.currentVisitors || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="text-success text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Sign-ins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.todaySignins || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Clock className="text-warning text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Visit Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.avgDuration || "0h"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Visitors Table */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Current Visitors</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search visitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/visitors"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                  }}
                  className="text-primary border-primary hover:bg-primary hover:text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sign-in Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? "No visitors found matching your search." : "No current visitors."}
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((visitor: Visitor) => (
                    <tr 
                      key={visitor.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedVisitor(visitor);
                        setSelectedVisitorId(visitor.id);
                      }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gray-300 text-gray-600">
                              {visitor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {visitor.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visitor.company || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visitor.hostName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(visitor.signInTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonBadgeColor(visitor.visitReason)}`}>
                          {visitor.visitReason}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              signOutMutation.mutate(visitor.id);
                            }}
                            disabled={signOutMutation.isPending}
                            className="text-warning hover:text-yellow-600"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisitor(visitor);
                              setSelectedVisitorId(visitor.id);
                            }}
                            className="text-primary hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredVisitors.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredVisitors.length}</span> of{" "}
                  <span className="font-medium">{currentVisitors.length}</span> current visitors
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Visitor Details Modal */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => {
        setSelectedVisitor(null);
        setSelectedVisitorId(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visitor Details</DialogTitle>
            <DialogDescription>
              Complete information about the visitor
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisitor && (
            <div className="space-y-6">
              {/* Visitor Header */}
              <div className="flex items-center space-x-4">
                {fullVisitorData?.photoData ? (
                  <div className="h-24 w-24 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={fullVisitorData.photoData} 
                      alt={`${selectedVisitor.name}'s photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-white text-2xl">
                      {selectedVisitor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedVisitor.name}</h3>
                  <Badge className={`mt-1 ${getReasonBadgeColor(selectedVisitor.visitReason)}`}>
                    {selectedVisitor.visitReason}
                  </Badge>
                  {!fullVisitorData?.photoData && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Camera className="h-3 w-3 mr-1" />
                      No photo captured
                    </p>
                  )}
                </div>
              </div>

              {/* Visitor Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-base text-gray-900">{selectedVisitor.company || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Host</p>
                      <p className="text-base text-gray-900">{selectedVisitor.hostName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email Notification</p>
                      <p className="text-base text-gray-900">
                        {selectedVisitor.emailSent ? (
                          <span className="text-green-600">Sent to host</span>
                        ) : (
                          <span className="text-gray-500">Not sent</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sign-in Time</p>
                      <p className="text-base text-gray-900">
                        {new Date(selectedVisitor.signInTime).toLocaleString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {selectedVisitor.signOutTime && (
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Sign-out Time</p>
                        <p className="text-base text-gray-900">
                          {new Date(selectedVisitor.signOutTime).toLocaleString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="text-base text-gray-900">
                        {(() => {
                          const signIn = new Date(selectedVisitor.signInTime);
                          const signOut = selectedVisitor.signOutTime 
                            ? new Date(selectedVisitor.signOutTime) 
                            : new Date();
                          const duration = Math.floor((signOut.getTime() - signIn.getTime()) / 1000 / 60);
                          const hours = Math.floor(duration / 60);
                          const minutes = duration % 60;
                          return hours > 0 
                            ? `${hours}h ${minutes}m` 
                            : `${minutes}m`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-base font-semibold">
                      {selectedVisitor.isSignedOut ? (
                        <span className="text-gray-600">Signed Out</span>
                      ) : (
                        <span className="text-green-600">Currently In Building</span>
                      )}
                    </p>
                  </div>
                  
                  {!selectedVisitor.isSignedOut && (
                    <Button
                      onClick={() => {
                        signOutMutation.mutate(selectedVisitor.id);
                        setSelectedVisitor(null);
                        setSelectedVisitorId(null);
                      }}
                      disabled={signOutMutation.isPending}
                      className="bg-warning text-white hover:bg-yellow-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out Visitor
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
