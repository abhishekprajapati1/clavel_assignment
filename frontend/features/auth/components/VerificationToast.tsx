"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface VerificationToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}

export const VerificationToast: React.FC<VerificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto dismiss after duration
    if (notification.duration && notification.duration > 0) {
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(dismissTimer);
      };
    }

    return () => clearTimeout(timer);
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
      if (notification.onDismiss) {
        notification.onDismiss();
      }
    }, 300);
  };

  const getToastStyles = () => {
    const baseClasses = `
      transform transition-all duration-300 ease-in-out
      bg-white border-l-4 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
      ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
    `;

    const typeClasses = {
      success: "border-green-500",
      error: "border-red-500",
      warning: "border-orange-500",
      info: "border-blue-500",
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
  };

  const getIcon = () => {
    const iconProps = { className: "h-5 w-5 flex-shrink-0" };

    switch (notification.type) {
      case "success":
        return (
          <CheckCircle
            {...iconProps}
            className="h-5 w-5 flex-shrink-0 text-green-500"
          />
        );
      case "error":
        return (
          <XCircle
            {...iconProps}
            className="h-5 w-5 flex-shrink-0 text-red-500"
          />
        );
      case "warning":
        return (
          <AlertCircle
            {...iconProps}
            className="h-5 w-5 flex-shrink-0 text-orange-500"
          />
        );
      case "info":
        return (
          <Mail
            {...iconProps}
            className="h-5 w-5 flex-shrink-0 text-blue-500"
          />
        );
      default:
        return (
          <AlertCircle
            {...iconProps}
            className="h-5 w-5 flex-shrink-0 text-gray-500"
          />
        );
    }
  };

  const getTitleColor = () => {
    switch (notification.type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "warning":
        return "text-orange-800";
      case "info":
        return "text-blue-800";
      default:
        return "text-gray-800";
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3">
        {getIcon()}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${getTitleColor()}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {notification.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={notification.action.onClick}
                className="text-xs"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && !isExiting && (
        <div className="mt-3 bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-current opacity-30 rounded-full transition-transform ease-linear"
            style={{
              animation: `shrink ${notification.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  position = "top-right",
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3`}>
      {notifications.map((notification) => (
        <VerificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Hook for managing toast notifications
export const useToastNotifications = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: ToastNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    setNotifications((prev) => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Predefined notification creators
  const showSuccess = (
    title: string,
    message: string,
    options?: Partial<ToastNotification>,
  ) => {
    return addNotification({
      type: "success",
      title,
      message,
      ...options,
    });
  };

  const showError = (
    title: string,
    message: string,
    options?: Partial<ToastNotification>,
  ) => {
    return addNotification({
      type: "error",
      title,
      message,
      duration: 8000, // Errors stay longer
      ...options,
    });
  };

  const showWarning = (
    title: string,
    message: string,
    options?: Partial<ToastNotification>,
  ) => {
    return addNotification({
      type: "warning",
      title,
      message,
      ...options,
    });
  };

  const showInfo = (
    title: string,
    message: string,
    options?: Partial<ToastNotification>,
  ) => {
    return addNotification({
      type: "info",
      title,
      message,
      ...options,
    });
  };

  // Verification-specific notifications
  const showVerificationSuccess = () => {
    return showSuccess(
      "Email Verified!",
      "Your email has been successfully verified. You can now sign in to your account.",
      {
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = "/signin"),
        },
      },
    );
  };

  const showVerificationError = (errorMessage?: string) => {
    return showError(
      "Verification Failed",
      errorMessage ||
        "We couldn't verify your email. The link may be invalid or expired.",
      {
        action: {
          label: "Try Again",
          onClick: () => window.location.reload(),
        },
      },
    );
  };

  const showResendSuccess = (email: string) => {
    return showSuccess(
      "Verification Email Sent",
      `A new verification link has been sent to ${email}. Please check your inbox.`,
      {
        duration: 7000,
      },
    );
  };

  const showResendError = (errorMessage?: string) => {
    return showError(
      "Failed to Send Email",
      errorMessage ||
        "We couldn't send the verification email. Please try again later.",
      {
        action: {
          label: "Retry",
          onClick: () => window.location.reload(),
        },
      },
    );
  };

  const showTokenExpired = () => {
    return showWarning(
      "Link Expired",
      "Your verification link has expired. We can send you a new one.",
      {
        duration: 10000,
        action: {
          label: "Get New Link",
          onClick: () => (window.location.href = "/resend-verification"),
        },
      },
    );
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    // Verification-specific methods
    showVerificationSuccess,
    showVerificationError,
    showResendSuccess,
    showResendError,
    showTokenExpired,
  };
};

export default VerificationToast;
