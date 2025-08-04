"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useResendVerification } from "../hooks/useEmailVerification";

const resendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResendFormData = z.infer<typeof resendSchema>;

interface ResendVerificationFormProps {
  initialEmail?: string;
  onSuccess?: (email: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

export const ResendVerificationForm: React.FC<ResendVerificationFormProps> = ({
  initialEmail = "",
  onSuccess,
  onCancel,
  showCancel = true,
  className = "",
}) => {
  const {
    isLoading,
    isSuccess,
    isError,
    error,
    message,
    resendVerification,
    reset,
  } = useResendVerification();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (data: ResendFormData) => {
    try {
      setSubmitted(true);
      await resendVerification(data.email);
      if (onSuccess) {
        onSuccess(data.email);
      }
    } catch (error) {
      // Error is handled by the hook
      console.error("Resend verification failed:", error);
    }
  };

  const handleReset = () => {
    reset();
    setSubmitted(false);
    form.reset();
  };

  if (isSuccess && submitted) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Verification Email Sent!
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message ||
              `We've sent a new verification link to ${form.getValues("email")}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Check your email inbox and spam folder for the verification link.
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={handleReset} variant="outline" className="w-full">
              Send to Different Email
            </Button>

            <Button
              onClick={() => (window.location.href = "/signin")}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-blue-500" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          Resend Verification Email
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter your email address and we'll send you a new verification link
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                      disabled={isLoading}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Email
                  </>
                )}
              </Button>

              {showCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={
                    onCancel || (() => (window.location.href = "/signin"))
                  }
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Remember to check your spam folder if you don't see the email.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResendVerificationForm;
