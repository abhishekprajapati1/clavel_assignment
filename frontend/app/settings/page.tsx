"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Lock,
  Smartphone,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  Calendar,
  MapPin,
  Monitor,
  LogOut,
  AlertTriangle,
  Settings,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserDetails, useUserAccessInfo } from "@/lib/api";

interface Session {
  id: string;
  device_info: {
    browser?: string;
    os?: string;
    device?: string;
    user_agent?: string;
  };
  ip_address?: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  inactive_sessions: number;
  sessions_by_device: Record<string, number>;
  sessions_by_browser: Record<string, number>;
}

function SettingsContent() {
  const router = useRouter();
  const { data: userDetails, isLoading, refetch } = useUserDetails();
  const { data: userAccessInfo } = useUserAccessInfo();

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Session management states
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (userDetails) {
      setProfileForm({
        first_name: userDetails.first_name,
        last_name: userDetails.last_name,
        email: userDetails.email,
      });
    }
  }, [userDetails]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    loadSessionStats();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch("/api/auth/sessions", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionStats = async () => {
    try {
      const response = await fetch("/api/auth/sessions/stats", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSessionStats(data);
      }
    } catch (error) {
      console.error("Failed to load session stats");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch("/api/auth/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/auth/settings/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (response.ok) {
        toast.success("Password changed successfully");
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Device logged out successfully");
        loadSessions();
        loadSessionStats();
      } else {
        toast.error("Failed to logout device");
      }
    } catch (error) {
      toast.error("Failed to logout device");
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Logged out from all devices");
        router.push("/signin");
      } else {
        toast.error("Failed to logout from all devices");
      }
    } catch (error) {
      toast.error("Failed to logout from all devices");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
      toast.error("Please type 'DELETE_MY_ACCOUNT' to confirm");
      return;
    }

    try {
      const response = await fetch("/api/auth/settings/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (response.ok) {
        toast.success("Account deleted successfully");
        router.push("/");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete account");
      }
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (deviceInfo: Session["device_info"]) => {
    const userAgent = deviceInfo.user_agent?.toLowerCase() || "";
    if (userAgent.includes("mobile") || userAgent.includes("android") || userAgent.includes("iphone")) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getDeviceName = (deviceInfo: Session["device_info"]) => {
    if (deviceInfo.browser && deviceInfo.os) {
      return `${deviceInfo.browser} on ${deviceInfo.os}`;
    }
    if (deviceInfo.device) {
      return deviceInfo.device;
    }
    return "Unknown Device";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your account, security, and preferences
          </p>
        </div>

        {/* Account Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {userDetails?.first_name} {userDetails?.last_name}
                  </h3>
                  <p className="text-gray-600">{userDetails?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userAccessInfo?.is_premium && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <Badge variant={userDetails?.is_verified ? "default" : "destructive"}>
                  {userDetails?.is_verified ? "Verified" : "Unverified"}
                </Badge>
                <Badge variant="outline">
                  {userDetails?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, first_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, last_name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member since {formatDate(userDetails?.created_at || "")}
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            current_password: e.target.value,
                          })
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current,
                          })
                        }
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: e.target.value,
                          })
                        }
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new,
                          })
                        }
                      >
                        {showPasswords.new ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirm_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: e.target.value,
                          })
                        }
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
                    </AlertDescription>
                  </Alert>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <div className="space-y-6">
              {/* Session Stats */}
              {sessionStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Session Overview</CardTitle>
                    <CardDescription>
                      Summary of your login sessions across all devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {sessionStats.active_sessions}
                        </div>
                        <div className="text-sm text-gray-600">Active Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {sessionStats.total_sessions}
                        </div>
                        <div className="text-sm text-gray-600">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {sessionStats.inactive_sessions}
                        </div>
                        <div className="text-sm text-gray-600">Expired Sessions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Sessions</CardTitle>
                      <CardDescription>
                        Manage devices that are currently signed in to your account
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSessions}
                        disabled={loadingSessions}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingSessions ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogoutAllDevices}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.filter(s => s.is_active).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(session.device_info)}
                          <div>
                            <div className="font-medium">
                              {getDeviceName(session.device_info)}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-4">
                              {session.ip_address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {session.ip_address}
                                </span>
                              )}
                              <span>Last active: {formatDate(session.last_activity)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Active</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogoutSession(session.id)}
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    ))}
                    {sessions.filter(s => s.is_active).length === 0 && !loadingSessions && (
                      <div className="text-center py-8 text-gray-500">
                        No active sessions found
                      </div>
                    )}
                    {loadingSessions && (
                      <div className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Loading sessions...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    These actions cannot be undone. Please proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-600 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be reversed.
                  </p>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="delete_confirmation">
                            Type "DELETE_MY_ACCOUNT" to confirm:
                          </Label>
                          <Input
                            id="delete_confirmation"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE_MY_ACCOUNT"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteDialog(false);
                            setDeleteConfirmation("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== "DELETE_MY_ACCOUNT"}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
