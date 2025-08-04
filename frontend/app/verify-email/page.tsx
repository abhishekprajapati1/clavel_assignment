"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EmailVerificationStatus } from "@/features/auth/components/EmailVerificationStatus";
import { ResendVerificationForm } from "@/features/auth/components/ResendVerificationForm";
import { EmailVerificationErrorBoundary } from "@/features/auth/components/EmailVerificationErrorBoundary";
import {
  useEmailVerification,
  useResendVerification,
} from "@/features/auth/hooks/useEmailVerification";
import {
  validateEmailVerificationToken,
  extractEmailFromToken,
  debugToken,
} from "@/features/auth/utils/jwt";
import { Loader2 } from "lucide-react";

// Component to handle the verification logic
const VerificationHandler: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showResendForm, setShowResendForm] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "expired" | "invalid"
  >("loading");

  const {
    isLoading: isVerifying,
    isSuccess: verificationSuccess,
    isError: verificationError,
    error: verificationErrorMessage,
    message: verificationMessage,
    verifyEmail,
    reset: resetVerification,
  } = useEmailVerification();

  const {
    isLoading: isResending,
    isSuccess: resendSuccess,
    isError: resendError,
    error: resendErrorMessage,
    message: resendMessage,
    resendVerification,
    reset: resetResend,
  } = useResendVerification();

  // Auto-verify email on component mount if token exists
  useEffect(() => {
    if (token) {
      // Validate token format first
      const tokenInfo = validateAndExtractTokenInfo(token);

      if (!tokenInfo.isValid) {
        if (tokenInfo.isExpired) {
          setVerificationStatus("expired");
        } else {
          setVerificationStatus("invalid");
        }
        return;
      }

      // Extract email from valid token
      setUserEmail(tokenInfo.email);

      // Proceed with verification
      handleEmailVerification(token);
    } else {
      setVerificationStatus("invalid");
    }
  }, [token]);

  const handleEmailVerification = async (verificationToken: string) => {
    try {
      setVerificationStatus("loading");
      await verifyEmail(verificationToken);
      setVerificationStatus("success");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Verification failed";

      // Determine error type based on error message
      if (errorMessage.toLowerCase().includes("expired")) {
        setVerificationStatus("expired");
      } else if (errorMessage.toLowerCase().includes("invalid")) {
        setVerificationStatus("invalid");
      } else if (errorMessage.toLowerCase().includes("already verified")) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
      }
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      setShowResendForm(true);
      return;
    }

    try {
      await resendVerification(userEmail);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRetryVerification = () => {
    if (token) {
      resetVerification();
      handleEmailVerification(token);
    }
  };

  const validateAndExtractTokenInfo = (token: string) => {
    // Debug token in development
    if (process.env.NODE_ENV === "development") {
      debugToken(token);
    }

    const validation = validateEmailVerificationToken(token);
    const email = extractEmailFromToken(token);

    return {
      isValid: validation.isValid,
      email,
      error: validation.error,
      isExpired: validation.isExpired,
    };
  };

  // This effect is now handled in the initial token validation above
  // Keeping this comment for clarity

  // Reset resend state when verification status changes
  useEffect(() => {
    if (verificationStatus === "success") {
      resetResend();
      setShowResendForm(false);
    }
  }, [verificationStatus, resetResend]);

  // Show resend form if requested
  if (showResendForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ResendVerificationForm
          initialEmail={userEmail}
          onSuccess={(email) => {
            setUserEmail(email);
            setShowResendForm(false);
          }}
          onCancel={() => setShowResendForm(false)}
        />
      </div>
    );
  }

  // Main verification status display
  return (
    <EmailVerificationStatus
      status={verificationStatus}
      message={verificationMessage}
      error={verificationErrorMessage}
      email={userEmail}
      onResendVerification={handleResendVerification}
      onRetry={handleRetryVerification}
      isResending={isResending}
      resendMessage={resendMessage}
      resendError={resendErrorMessage}
    />
  );
};

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
      <p className="text-gray-600">Loading verification page...</p>
    </div>
  </div>
);

// Main page component with Suspense boundary and error boundary
const VerifyEmailPage: React.FC = () => {
  return (
    <EmailVerificationErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingFallback />}>
          <VerificationHandler />
        </Suspense>
      </div>
    </EmailVerificationErrorBoundary>
  );
};

export default VerifyEmailPage;
