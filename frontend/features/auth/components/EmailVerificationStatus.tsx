"use client";

import React from "react";
import { CheckCircle, XCircle, Loader2, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailVerificationStatusProps {
  status: "loading" | "success" | "error" | "expired" | "invalid";
  message?: string;
  error?: string;
  email?: string;
  onResendVerification?: () => void;
  onRetry?: () => void;
  isResending?: boolean;
  resendMessage?: string;
  resendError?: string;
}

export const EmailVerificationStatus: React.FC<
  EmailVerificationStatusProps
> = ({
  status,
  message,
  error,
  email,
  onResendVerification,
  onRetry,
  isResending = false,
  resendMessage,
  resendError,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "loading":
        return {
          icon: <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />,
          title: "Verifying your email...",
          description: "Please wait while we verify your email address.",
          variant: "default" as const,
          showActions: false,
        };
      case "success":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Email verified successfully!",
          description:
            message ||
            "Your email has been verified. You can now sign in to your account.",
          variant: "default" as const,
          showActions: true,
          actionType: "signin" as const,
        };
      case "error":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Verification failed",
          description:
            error ||
            "We couldn't verify your email. The link may be invalid or expired.",
          variant: "destructive" as const,
          showActions: true,
          actionType: "resend" as const,
        };
      case "expired":
        return {
          icon: <AlertCircle className="h-16 w-16 text-orange-500" />,
          title: "Verification link expired",
          description:
            "Your verification link has expired. We can send you a new one.",
          variant: "default" as const,
          showActions: true,
          actionType: "resend" as const,
        };
      case "invalid":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Invalid verification link",
          description:
            "The verification link is invalid. Please check the link or request a new one.",
          variant: "destructive" as const,
          showActions: true,
          actionType: "resend" as const,
        };
      default:
        return {
          icon: <Mail className="h-16 w-16 text-gray-500" />,
          title: "Email verification",
          description: "Please check your email for verification instructions.",
          variant: "default" as const,
          showActions: false,
        };
    }
  };

  const config = getStatusConfig();

  const handleSignIn = () => {
    window.location.href = "/signin";
  };

  const handleResend = () => {
    if (onResendVerification) {
      onResendVerification();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{config.icon}</div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {config.title}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {config.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Show resend success message */}
            {resendMessage && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{resendMessage}</AlertDescription>
              </Alert>
            )}

            {/* Show resend error */}
            {resendError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            {config.showActions && (
              <div className="space-y-3">
                {config.actionType === "signin" && (
                  <Button onClick={handleSignIn} className="w-full" size="lg">
                    Sign In to Your Account
                  </Button>
                )}

                {config.actionType === "resend" && (
                  <div className="space-y-3">
                    {email && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-3">
                          Send a new verification email to:{" "}
                          <strong>{email}</strong>
                        </p>
                        <Button
                          onClick={handleResend}
                          disabled={isResending}
                          className="w-full"
                          size="lg"
                        >
                          {isResending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Verification Email
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {status === "error" && onRetry && (
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Try Again
                      </Button>
                    )}

                    <div className="text-center">
                      <Button
                        onClick={() => (window.location.href = "/signin")}
                        variant="ghost"
                        className="text-sm"
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Help text */}
            <div className="text-center text-sm text-gray-500 mt-6">
              <p>
                Need help?{" "}
                <a
                  href="/contact"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Contact support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationStatus;
