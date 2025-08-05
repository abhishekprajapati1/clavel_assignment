"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useLoggedInUser from "@/features/auth/hooks/useLoggedInUser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  FileImage,
  Download,
  Users,
  Crown,
  Activity,
  TrendingUp,
  Calendar,
  Eye,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface DashboardStats {
  total_templates: number;
  total_downloads: number;
  total_users: number;
  premium_users: number;
  verified_users: number;
  templates_this_month: number;
  downloads_this_month: number;
  users_this_month: number;
}

interface TemplateStats {
  template_id: string;
  template_title: string;
  download_count: number;
  view_count: number;
  uploaded_by: string;
  created_at: string;
}

interface MonthlyData {
  month: string;
  templates: number;
  downloads: number;
  users: number;
}

interface UserTypeData {
  name: string;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin, isLoadingUser } = useLoggedInUser();

  // Redirect non-admin users to templates page
  useEffect(() => {
    if (!isLoadingUser && user && !isAdmin) {
      router.push("/templates");
    }
  }, [user, isAdmin, isLoadingUser, router]);

  // Fetch dashboard statistics
  const {
    data: dashboardStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/api/admin/dashboard/stats");
      return response.data as DashboardStats;
    },
    enabled: !!user && isAdmin,
  });

  // Fetch top templates
  const {
    data: topTemplates,
    isLoading: isLoadingTemplates,
    error: templatesError,
  } = useQuery({
    queryKey: ["admin-top-templates"],
    queryFn: async () => {
      const response = await api.get("/api/admin/dashboard/top-templates");
      return response.data as TemplateStats[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch monthly analytics
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
    error: monthlyError,
  } = useQuery({
    queryKey: ["admin-monthly-analytics"],
    queryFn: async () => {
      const response = await api.get("/api/admin/dashboard/monthly-analytics");
      return response.data as MonthlyData[];
    },
    enabled: !!user && isAdmin,
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (statsError || templatesError || monthlyError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard data. Please try again later.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // Prepare user type data for pie chart
  const userTypeData: UserTypeData[] = [
    {
      name: "Premium Users",
      value: dashboardStats?.premium_users || 0,
      color: "#f59e0b",
    },
    {
      name: "Free Users",
      value:
        (dashboardStats?.total_users || 0) -
        (dashboardStats?.premium_users || 0),
      color: "#6b7280",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <LayoutDashboard className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Overview of templates, downloads, and user activity
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/templates")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Template
              </Button>
              <Button variant="outline" onClick={() => router.push("/users")}>
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Templates
              </CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : dashboardStats?.total_templates || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{dashboardStats?.templates_this_month || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Downloads
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : dashboardStats?.total_downloads || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{dashboardStats?.downloads_this_month || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : dashboardStats?.total_users || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{dashboardStats?.users_this_month || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Premium Users
              </CardTitle>
              <Crown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : dashboardStats?.premium_users || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {(dashboardStats?.total_users || 0) > 0
                  ? Math.round(
                      ((dashboardStats?.premium_users || 0) /
                        (dashboardStats?.total_users || 1)) *
                        100,
                    )
                  : 0}
                % of total users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>
                Templates, downloads, and user registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMonthly ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="templates" fill="#3b82f6" name="Templates" />
                    <Bar dataKey="downloads" fill="#10b981" name="Downloads" />
                    <Bar dataKey="users" fill="#f59e0b" name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Premium vs Free users</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Templates</CardTitle>
            <CardDescription>
              Most downloaded templates in your library
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {topTemplates?.map((template, index) => (
                  <div
                    key={template.template_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {template.template_title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          By {template.uploaded_by} •{" "}
                          {formatDate(template.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {template.download_count}
                        </div>
                        <div className="text-xs text-gray-600">Downloads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {template.view_count}
                        </div>
                        <div className="text-xs text-gray-600">Views</div>
                      </div>
                    </div>
                  </div>
                ))}

                {topTemplates?.length === 0 && (
                  <div className="text-center py-8">
                    <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No templates yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload your first template to get started
                    </p>
                    <Button onClick={() => router.push("/templates")}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Template
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push("/templates")}
              >
                <Upload className="w-6 h-6 mb-2" />
                Upload New Template
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push("/users")}
              >
                <Users className="w-6 h-6 mb-2" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => {
                  // TODO: Implement analytics export
                  toast("Analytics export coming soon");
                }}
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                Export Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
