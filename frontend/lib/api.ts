import axios, { AxiosResponse, AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccessInfo {
  user_id: string;
  email: string;
  role: string;
  is_premium: boolean;
  has_premium_access: boolean;
  can_download: boolean;
  can_screenshot: boolean;
  premium_activated_at?: string;
  upgrade_required: boolean;
}

export interface PaymentSession {
  checkout_url: string;
  session_id: string;
}

export interface PaymentVerification {
  session_id: string;
  payment_status: string;
  is_premium: boolean;
  amount_paid: number;
  currency: string;
}

export interface Template {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  can_download?: boolean;
  can_screenshot?: boolean;
  access_level?: string;
}

export interface ApiError {
  detail: string;
  action?: string;
  redirect_to?: string;
}

// Axios instance configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // The cookies will be sent automatically due to withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError = error.response?.data as ApiError;

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
      }
    } else if (error.response?.status === 402) {
      // Payment required - don't show toast, let component handle it
      return Promise.reject(error);
    } else if (error.response?.status && error.response.status >= 500) {
      // Server errors
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  },
);

// API Functions
export const paymentApi = {
  // Get user access information
  getUserAccessInfo: async (): Promise<UserAccessInfo> => {
    const response = await api.get("/api/payment/user-access-info");
    return response.data;
  },

  // Create Stripe checkout session
  createCheckoutSession: async (): Promise<PaymentSession> => {
    const response = await api.post("/api/payment/create-checkout-session");
    return response.data;
  },

  // Verify payment session
  verifyPaymentSession: async (
    sessionId: string,
  ): Promise<PaymentVerification> => {
    const response = await api.get(`/api/payment/verify-session/${sessionId}`);
    return response.data;
  },

  // Test Stripe configuration
  testStripeConfig: async () => {
    const response = await api.get("/api/payment/config-test");
    return response.data;
  },
};

export const authApi = {
  // Get current user details
  getUserDetails: async (): Promise<User> => {
    const response = await api.get("/api/auth/details");
    return response.data;
  },

  // Sign in user
  signIn: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/api/auth/signin", credentials);
    return response.data;
  },

  // Sign out user
  signOut: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },
};

export const templateApi = {
  // Get templates list
  getTemplates: async (page = 1, perPage = 10) => {
    const response = await api.get("/api/templates/", {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  // Get template access info
  getTemplateAccessInfo: async () => {
    const response = await api.get("/api/templates/access-info");
    return response.data;
  },

  // Check screenshot permission for template
  checkScreenshotPermission: async (templateId: string) => {
    const response = await api.post(
      `/api/templates/${templateId}/check-screenshot`,
    );
    return response.data;
  },

  // Download template
  downloadTemplate: async (templateId: string, templateTitle: string) => {
    const response = await api.get(`/api/templates/${templateId}/download`, {
      responseType: "blob",
    });

    // Create download link
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Get filename from response headers or use template title
    const contentDisposition = response.headers["content-disposition"];
    let filename = `${templateTitle}_template`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
};

// React Query Hooks

// Query Keys
export const queryKeys = {
  userAccessInfo: ["user-access-info"] as const,
  userDetails: ["user-details"] as const,
  templates: (page: number, perPage: number) =>
    ["templates", page, perPage] as const,
  templateAccessInfo: ["template-access-info"] as const,
  stripeConfig: ["stripe-config"] as const,
};

// User Access Info Query
export const useUserAccessInfo = () => {
  return useQuery({
    queryKey: queryKeys.userAccessInfo,
    queryFn: paymentApi.getUserAccessInfo,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User Details Query
export const useUserDetails = () => {
  return useQuery({
    queryKey: queryKeys.userDetails,
    queryFn: authApi.getUserDetails,
    retry: (failureCount, error) => {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Templates Query
export const useTemplates = (page = 1, perPage = 10) => {
  return useQuery({
    queryKey: queryKeys.templates(page, perPage),
    queryFn: () => templateApi.getTemplates(page, perPage),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Template Access Info Query
export const useTemplateAccessInfo = () => {
  return useQuery({
    queryKey: queryKeys.templateAccessInfo,
    queryFn: templateApi.getTemplateAccessInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Stripe Config Query (for debugging)
export const useStripeConfig = () => {
  return useQuery({
    queryKey: queryKeys.stripeConfig,
    queryFn: paymentApi.testStripeConfig,
    enabled: process.env.NODE_ENV === "development",
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Payment Session Creation Mutation
export const useCreatePaymentSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentApi.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error("No checkout URL received");
      }
    },
    onError: (error: AxiosError) => {
      const apiError = error.response?.data as ApiError;

      if (
        error.response?.status === 402 &&
        apiError?.action === "upgrade_required"
      ) {
        toast.error("Premium access required");
      } else if (error.response?.status === 401) {
        toast.error("Please sign in to upgrade to premium");
      } else if (
        error.response?.status === 400 &&
        apiError?.detail?.includes("already has premium")
      ) {
        toast.success("You already have premium access!");
        // Invalidate user access queries to refresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccessInfo });
        queryClient.invalidateQueries({ queryKey: queryKeys.userDetails });
      } else {
        toast.error(apiError?.detail || "Failed to create checkout session");
      }
    },
  });
};

// Payment Verification Mutation
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      paymentApi.verifyPaymentSession(sessionId),
    onSuccess: (data) => {
      console.log("Payment verification success:", data);
      if (data.payment_status === "paid" && data.is_premium) {
        toast.success("Payment verified! You now have premium access.");
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccessInfo });
        queryClient.invalidateQueries({ queryKey: queryKeys.userDetails });
        queryClient.invalidateQueries({
          queryKey: queryKeys.templateAccessInfo,
        });
      } else {
        console.log("Payment not yet complete:", {
          payment_status: data.payment_status,
          is_premium: data.is_premium,
          session_id: data.session_id,
        });
        if (process.env.NODE_ENV === "development") {
          toast.error(
            `Payment status: ${data.payment_status}. Premium: ${data.is_premium ? "Yes" : "No"}`,
          );
        }
      }
    },
    onError: (error: AxiosError) => {
      const apiError = error.response?.data as ApiError;
      console.error("Payment verification error:", error);
      console.error("Error response:", apiError);

      if (error.response?.status === 403) {
        toast.error("Session verification failed - please try again");
      } else if (error.response?.status === 400) {
        toast.error("Invalid session - please create a new payment");
      } else {
        const errorMsg = apiError?.detail || "Failed to verify payment";
        if (process.env.NODE_ENV === "development") {
          toast.error(`Verification error: ${errorMsg}`);
        } else {
          toast.error("Payment verification failed");
        }
      }
    },
  });
};

// Template Download Mutation
export const useDownloadTemplate = () => {
  return useMutation({
    mutationFn: ({
      templateId,
      templateTitle,
    }: {
      templateId: string;
      templateTitle: string;
    }) => templateApi.downloadTemplate(templateId, templateTitle),
    onSuccess: (data) => {
      toast.success(`Template "${data.filename}" downloaded successfully!`);
    },
    onError: (error: AxiosError) => {
      const apiError = error.response?.data as ApiError;

      if (error.response?.status === 402) {
        if (apiError?.action === "upgrade_required") {
          toast.error("Premium access required for downloads");
        } else {
          toast.error("Premium access required");
        }
      } else if (error.response?.status === 404) {
        toast.error("Template not found");
      } else {
        toast.error(apiError?.detail || "Failed to download template");
      }
    },
  });
};

// Screenshot Permission Check Mutation
export const useCheckScreenshotPermission = () => {
  return useMutation({
    mutationFn: (templateId: string) =>
      templateApi.checkScreenshotPermission(templateId),
    onError: (error: AxiosError) => {
      const apiError = error.response?.data as ApiError;

      if (error.response?.status === 402) {
        // Don't show toast for 402 errors, let component handle upgrade flow
        return;
      } else {
        toast.error(
          apiError?.detail || "Failed to check screenshot permission",
        );
      }
    },
  });
};

// Sign Out Mutation
export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signOut,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      toast.success("Signed out successfully");
      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error: AxiosError) => {
      const apiError = error.response?.data as ApiError;
      toast.error(apiError?.detail || "Failed to sign out");
    },
  });
};

// Utility function to handle payment required errors
export const handlePaymentRequired = (error: AxiosError, router: any) => {
  const apiError = error.response?.data as ApiError;

  if (
    error.response?.status === 402 &&
    apiError?.action === "upgrade_required"
  ) {
    if (apiError.redirect_to) {
      router.push(apiError.redirect_to);
    } else {
      router.push("/payment");
    }
    return true;
  }

  return false;
};

// Utility function to check if user has premium access
export const checkPremiumAccess = (userAccessInfo?: UserAccessInfo) => {
  return {
    hasPremiumAccess: userAccessInfo?.has_premium_access || false,
    canDownload: userAccessInfo?.can_download || false,
    canScreenshot: userAccessInfo?.can_screenshot || false,
    isAdmin: userAccessInfo?.role === "admin",
    isPremium: userAccessInfo?.is_premium || false,
    upgradeRequired: userAccessInfo?.upgrade_required || false,
  };
};

export default api;
