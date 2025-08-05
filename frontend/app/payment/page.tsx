"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Camera, Shield, Crown } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useUserAccessInfo,
  useCreatePaymentSession,
  checkPremiumAccess,
} from "@/lib/api";

export default function PaymentPage() {
  const router = useRouter();

  // React Query hooks
  const {
    data: userAccessInfo,
    isLoading: isLoadingUserAccess,
    error: userAccessError,
    isError: isUserAccessError,
  } = useUserAccessInfo();

  const createPaymentSession = useCreatePaymentSession();

  // Check user access and redirect if necessary
  useEffect(() => {
    if (isUserAccessError && userAccessError) {
      const axiosError = userAccessError as any;
      if (axiosError.response?.status === 401) {
        toast.error("Please sign in to upgrade to premium");
        router.push("/signin?redirect=/payment");
      }
    }
  }, [isUserAccessError, userAccessError, router]);

  // Check if user already has premium access
  useEffect(() => {
    if (userAccessInfo?.has_premium_access) {
      toast.success("You already have premium access!");
      router.push("/dashboard");
    }
  }, [userAccessInfo, router]);

  const handleUpgrade = () => {
    if (!userAccessInfo) {
      toast.error("Please sign in to upgrade to premium");
      router.push("/signin?redirect=/payment");
      return;
    }

    createPaymentSession.mutate();
  };

  if (isLoadingUserAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isUserAccessError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to verify your account status.
          </p>
          <Button onClick={() => router.push("/signin")}>Sign In Again</Button>
        </div>
      </div>
    );
  }

  if (!userAccessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to verify your account status.
          </p>
          <Button onClick={() => router.push("/signin")}>Sign In Again</Button>
        </div>
      </div>
    );
  }

  const accessInfo = checkPremiumAccess(userAccessInfo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full mb-4">
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Premium Upgrade</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlock Premium Access
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get unlimited access to download templates and take screenshots with
            our premium plan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features Card */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Premium Features
              </CardTitle>
              <CardDescription className="text-center">
                Everything you need to work with templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Unlimited Downloads
                    </h3>
                    <p className="text-gray-600">
                      Download any template in high quality formats
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Camera className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Screenshot Access
                    </h3>
                    <p className="text-gray-600">
                      Take screenshots of templates for your projects
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Premium Support
                    </h3>
                    <p className="text-gray-600">
                      Get priority customer support
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Download className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Commercial License
                    </h3>
                    <p className="text-gray-600">
                      Use templates for commercial projects
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm text-center">
                  <strong>One-time payment</strong> - No recurring charges
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card className="border-2 border-green-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
              Best Value
            </div>

            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Premium Access</CardTitle>
              <CardDescription>One-time purchase</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold text-green-600">$9.99</span>
                <span className="text-gray-500 ml-2">one-time</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Template Downloads</span>
                  <Badge variant="secondary">Unlimited</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Screenshot Access</span>
                  <Badge variant="secondary">Included</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Commercial Use</span>
                  <Badge variant="secondary">Allowed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Premium Support</span>
                  <Badge variant="secondary">Priority</Badge>
                </div>
              </div>

              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg"
                disabled={createPaymentSession.isPending}
                size="lg"
              >
                {createPaymentSession.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Checkout Session...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Secure payment powered by Stripe
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span>🔒 SSL Encrypted</span>
                  <span>💳 All Cards Accepted</span>
                  <span>🛡️ Money Back Guarantee</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Maybe Later
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Current Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Account Type:</span>
                <div className="font-semibold">
                  {userAccessInfo.role === "admin" ? "Admin" : "Free User"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Can Download:</span>
                <div
                  className={`font-semibold ${accessInfo.canDownload ? "text-green-600" : "text-red-600"}`}
                >
                  {accessInfo.canDownload ? "Yes" : "No (Upgrade Required)"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Can Screenshot:</span>
                <div
                  className={`font-semibold ${accessInfo.canScreenshot ? "text-green-600" : "text-red-600"}`}
                >
                  {accessInfo.canScreenshot ? "Yes" : "No (Upgrade Required)"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
