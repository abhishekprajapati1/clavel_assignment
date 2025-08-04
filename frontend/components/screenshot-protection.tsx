"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Camera, Download, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useUserAccessInfo,
  useCheckScreenshotPermission,
  checkPremiumAccess,
  type UserAccessInfo,
} from "@/lib/api";

// User interface moved to lib/api.ts as UserAccessInfo

interface ScreenshotProtectionProps {
  children: ReactNode;
  templateId?: string;
  enforceProtection?: boolean;
  showUpgradePrompt?: boolean;
}

export default function ScreenshotProtection({
  children,
  templateId,
  enforceProtection = true,
  showUpgradePrompt = true,
}: ScreenshotProtectionProps) {
  const router = useRouter();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);

  // React Query hooks
  const {
    data: userAccessInfo,
    isLoading,
    error: userAccessError,
    isError: isUserAccessError,
  } = useUserAccessInfo();

  const checkScreenshotPermission = useCheckScreenshotPermission();

  const accessInfo = checkPremiumAccess(userAccessInfo);

  // Handle authentication errors
  useEffect(() => {
    if (isUserAccessError && userAccessError) {
      const axiosError = userAccessError as any;
      if (axiosError.response?.status === 401) {
        router.push("/signin");
      }
    }
  }, [isUserAccessError, userAccessError, router]);

  // Screenshot prevention effects
  useEffect(() => {
    if (!enforceProtection || !userAccessInfo || accessInfo.hasPremiumAccess) {
      return;
    }

    const preventScreenshot = () => {
      handleScreenshotAttempt();
    };

    // Detect Print Screen key
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        preventScreenshot();
        return false;
      }

      // Windows Snipping Tool (Win + Shift + S)
      if (e.metaKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        preventScreenshot();
        return false;
      }

      // Mac screenshot shortcuts
      if (
        e.metaKey &&
        e.shiftKey &&
        (e.key === "3" || e.key === "4" || e.key === "5")
      ) {
        e.preventDefault();
        preventScreenshot();
        return false;
      }

      // Developer tools shortcuts
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
        preventScreenshot();
        return false;
      }

      // Context menu (right-click prevention)
      if (e.key === "F10" && e.shiftKey) {
        e.preventDefault();
        preventScreenshot();
        return false;
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      preventScreenshot();
      return false;
    };

    // Detect focus loss (might indicate screenshot tools)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page lost focus - might be screenshot tool
        setTimeout(() => {
          if (!document.hidden) {
            // Page regained focus quickly - likely screenshot
            preventScreenshot();
          }
        }, 100);
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Disable text selection and drag
    document.body.style.userSelect = "none";
    document.body.style.setProperty("-webkit-user-select", "none");
    document.body.style.setProperty("-moz-user-select", "none");
    document.body.style.setProperty("-ms-user-select", "none");

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("dragstart", handleDragStart);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("dragstart", handleDragStart);

      // Restore text selection
      document.body.style.userSelect = "";
      document.body.style.setProperty("-webkit-user-select", "");
      document.body.style.setProperty("-moz-user-select", "");
      document.body.style.setProperty("-ms-user-select", "");
    };
  }, [userAccessInfo, accessInfo.hasPremiumAccess, enforceProtection]);

  const handleScreenshotAttempt = useCallback(async () => {
    if (!userAccessInfo || accessInfo.hasPremiumAccess) {
      return;
    }

    setScreenshotAttempted(true);

    // Check specific template screenshot permission if templateId provided
    if (templateId) {
      try {
        await checkScreenshotPermission.mutateAsync(templateId);
        // If we get here, user has permission
        return;
      } catch (error) {
        // Error is handled by the mutation, just continue with upgrade flow
      }
    }

    if (showUpgradePrompt) {
      setShowUpgradeDialog(true);
      toast.error("Premium access required for screenshots");
    }

    // Blur the page to prevent screenshot visibility
    document.body.style.filter = "blur(10px)";
    setTimeout(() => {
      document.body.style.filter = "";
    }, 3000);
  }, [
    userAccessInfo,
    accessInfo.hasPremiumAccess,
    templateId,
    showUpgradePrompt,
    checkScreenshotPermission,
  ]);

  const handleUpgrade = () => {
    setShowUpgradeDialog(false);
    router.push("/payment");
  };

  const handleCloseDialog = () => {
    setShowUpgradeDialog(false);
    setScreenshotAttempted(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isUserAccessError || !userAccessInfo) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Lock className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 mb-4">
          Please sign in to view this content.
        </p>
        <Button onClick={() => router.push("/signin")}>Sign In</Button>
      </div>
    );
  }

  return (
    <>
      {/* Main content */}
      <div className="relative">
        {children}

        {/* Access indicator */}
        {userAccessInfo && (
          <div className="fixed top-4 right-4 z-50">
            <Badge
              variant={accessInfo.hasPremiumAccess ? "default" : "destructive"}
              className={`flex items-center gap-1 ${
                accessInfo.hasPremiumAccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {accessInfo.hasPremiumAccess ? (
                <>
                  <Crown className="w-3 h-3" />
                  Premium
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  Free
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Non-premium overlay for restricted content */}
        {enforceProtection &&
          userAccessInfo &&
          !accessInfo.hasPremiumAccess && (
            <div className="absolute inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm pointer-events-auto">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-gray-600 mb-4">
                  Upgrade to premium to download and screenshot templates
                </p>
                <Button onClick={handleUpgrade} className="w-full">
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <DialogTitle>Screenshot Blocked</DialogTitle>
            </div>
            <DialogDescription>
              Screenshots and downloads require premium access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">
                Why upgrade to premium?
              </h4>
              <div className="space-y-2 text-sm text-orange-700">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download templates in high quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Take screenshots for your projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>Access premium support</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 mb-1">$9.99</p>
              <p className="text-sm text-gray-600">One-time payment</p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleUpgrade} className="w-full" size="lg">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
              <Button
                onClick={handleCloseDialog}
                variant="outline"
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook for checking premium access using React Query
export function usePremiumAccess() {
  const {
    data: userAccessInfo,
    isLoading: loading,
    error,
    isError,
  } = useUserAccessInfo();

  const accessInfo = checkPremiumAccess(userAccessInfo);

  return {
    user: userAccessInfo,
    loading,
    error,
    isError,
    ...accessInfo,
  };
}

// Higher-order component for premium-only pages
export function withPremiumAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  return function PremiumProtectedComponent(props: P) {
    const { hasPremiumAccess, loading, isError } = usePremiumAccess();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isError && !hasPremiumAccess) {
        toast.error("Premium access required");
        router.push("/payment");
      }
    }, [loading, isError, hasPremiumAccess, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (isError || !hasPremiumAccess) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
