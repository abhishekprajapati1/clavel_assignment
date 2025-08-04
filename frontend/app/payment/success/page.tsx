"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Download,
  Camera,
  Crown,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useVerifyPayment,
  useUserAccessInfo,
  PaymentVerification,
} from "@/lib/api";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [paymentDetails, setPaymentDetails] =
    useState<PaymentVerification | null>(null);
  const [countdown, setCountdown] = useState(5);

  // React Query hooks
  const verifyPayment = useVerifyPayment();
  const { refetch: refetchUserAccess } = useUserAccessInfo();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      handlePaymentVerification(sessionId);
    } else {
      setVerificationStatus("error");
      toast.error("No payment session found");
    }
  }, [searchParams]);

  useEffect(() => {
    if (verificationStatus === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (verificationStatus === "success" && countdown === 0) {
      router.push("/dashboard");
    }
  }, [verificationStatus, countdown, router]);

  const handlePaymentVerification = async (sessionId: string) => {
    try {
      const result = await verifyPayment.mutateAsync(sessionId);
      setPaymentDetails(result);

      if (result.payment_status === "paid" && result.is_premium) {
        setVerificationStatus("success");
        // Refetch user access info to update the UI
        refetchUserAccess();
      } else {
        setVerificationStatus("pending");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setVerificationStatus("error");
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(amount / 100);
  };

  if (verificationStatus === "verifying" || verifyPayment.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <CardTitle className="text-2xl text-blue-800">
              Verifying Payment...
            </CardTitle>
            <CardDescription className="text-blue-600">
              Please wait while we confirm your payment
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "error" || verifyPayment.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-red-800">
              Payment Verification Failed
            </CardTitle>
            <CardDescription className="text-red-600">
              We couldn't verify your payment automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => {
                const sessionId = searchParams.get("session_id");
                if (sessionId) {
                  handlePaymentVerification(sessionId);
                }
              }}
              variant="outline"
              className="w-full"
              disabled={verifyPayment.isPending}
            >
              {verifyPayment.isPending ? "Checking..." : "Retry Verification"}
            </Button>
            <Button
              onClick={() => router.push("/payment")}
              variant="outline"
              className="w-full"
            >
              Try Payment Again
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mb-4">
              <div className="animate-pulse">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-yellow-800">
              Payment Processing
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Your payment is being processed. This may take a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                Your premium access will be activated automatically once the
                payment is confirmed.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  const sessionId = searchParams.get("session_id");
                  if (sessionId) {
                    handlePaymentVerification(sessionId);
                  }
                }}
                variant="outline"
                className="w-full"
                disabled={verifyPayment.isPending}
              >
                {verifyPayment.isPending ? "Checking..." : "Refresh Status"}
              </Button>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl text-green-800">
            🎉 Welcome to Premium!
          </CardTitle>
          <CardDescription className="text-green-600 text-lg">
            Your payment has been successfully processed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                Payment Details
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium">
                    {formatAmount(
                      paymentDetails.amount_paid,
                      paymentDetails.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-200 text-green-800"
                  >
                    Paid
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Premium Features */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">
              You Now Have Access To:
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-600" />
                <span>Unlimited Downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-green-600" />
                <span>Screenshot Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-green-600" />
                <span>Premium Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Commercial License</span>
              </div>
            </div>
          </div>

          {/* Auto-redirect notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              Redirecting to dashboard in{" "}
              <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Explore Premium Features
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Browse Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
