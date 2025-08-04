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
import { XCircle, ArrowLeft, RefreshCw, Crown, HelpCircle } from "lucide-react";
import { toast } from "react-hot-toast";

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [reason, setReason] = useState("user_cancelled");

  useEffect(() => {
    // Check if there's a specific reason in the URL params
    const cancelReason = searchParams.get("reason") || "user_cancelled";
    setReason(cancelReason);

    // Show appropriate toast message
    if (cancelReason === "payment_failed") {
      toast.error("Payment failed. Please try again.");
    } else {
      toast.error("Payment was cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      router.push("/dashboard");
    }
  }, [countdown, router]);

  const handleRetryPayment = () => {
    router.push("/payment");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const getReason = () => {
    switch (reason) {
      case "payment_failed":
        return {
          title: "Payment Failed",
          description: "Your payment could not be processed",
          icon: <XCircle className="w-10 h-10 text-red-500" />,
          bgColor: "from-red-50 to-pink-100",
          cardBorder: "border-red-200",
        };
      case "insufficient_funds":
        return {
          title: "Insufficient Funds",
          description: "Your payment method has insufficient funds",
          icon: <XCircle className="w-10 h-10 text-red-500" />,
          bgColor: "from-red-50 to-pink-100",
          cardBorder: "border-red-200",
        };
      case "card_declined":
        return {
          title: "Card Declined",
          description: "Your card was declined by your bank",
          icon: <XCircle className="w-10 h-10 text-red-500" />,
          bgColor: "from-red-50 to-pink-100",
          cardBorder: "border-red-200",
        };
      default:
        return {
          title: "Payment Cancelled",
          description: "You cancelled the payment process",
          icon: <XCircle className="w-10 h-10 text-orange-500" />,
          bgColor: "from-orange-50 to-yellow-100",
          cardBorder: "border-orange-200",
        };
    }
  };

  const reasonInfo = getReason();

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${reasonInfo.bgColor} p-4`}
    >
      <Card
        className={`w-full max-w-lg text-center border-2 ${reasonInfo.cardBorder}`}
      >
        <CardHeader>
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            {reasonInfo.icon}
          </div>
          <CardTitle className="text-3xl text-gray-800">
            {reasonInfo.title}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {reasonInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Information about what happened */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">What happened?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              {reason === "user_cancelled" && (
                <p>
                  You chose to cancel the payment process before completing it.
                  No charges were made to your account.
                </p>
              )}
              {reason === "payment_failed" && (
                <p>
                  Your payment could not be processed. This could be due to
                  technical issues or problems with your payment method.
                </p>
              )}
              {reason === "insufficient_funds" && (
                <p>
                  Your payment method doesn't have sufficient funds to complete
                  this transaction. Please try a different payment method.
                </p>
              )}
              {reason === "card_declined" && (
                <p>
                  Your card was declined by your bank. Please contact your bank
                  or try a different payment method.
                </p>
              )}
            </div>
          </div>

          {/* Premium features reminder */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">
                Premium Features Waiting
              </h3>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Unlock unlimited downloads, screenshot access, and premium support
              for just $9.99
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
              <span>✓ Unlimited Downloads</span>
              <span>✓ Screenshot Access</span>
              <span>✓ Premium Support</span>
              <span>✓ Commercial License</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetryPayment}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Payment Again
            </Button>

            <Button
              onClick={handleGoToDashboard}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Help section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-800">Need Help?</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              If you continue to experience payment issues, here are some tips:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Ensure your card has sufficient funds</li>
              <li>• Check that your billing address is correct</li>
              <li>• Try a different payment method</li>
              <li>• Contact your bank if the card is being declined</li>
              <li>• Reach out to our support team for assistance</li>
            </ul>
          </div>

          {/* Auto-redirect notice */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-800 text-sm">
              Redirecting to dashboard in{" "}
              <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>

          {/* Support contact */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Still having trouble? Contact our support team at{" "}
              <a
                href="mailto:support@templater.com"
                className="text-blue-600 hover:underline"
              >
                support@templater.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
