import axios from "axios";
import {
  AuthResponse,
  SignUpData,
  SignInData,
  User,
  Session,
  SessionStats,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth header
api.interceptors.request.use((config) => {
  // Token will be sent via cookies automatically
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  // Sign up
  signUp: async (data: SignUpData): Promise<{ message: string }> => {
    const response = await api.post("/api/auth/signup", data);
    return response.data;
  },

  // Sign in
  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/signin", data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post("/api/auth/verify-email", { token });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post("/api/auth/forgot", { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const response = await api.post("/api/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/refresh-token", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // Get user details
  getUserDetails: async (): Promise<User> => {
    const response = await api.get("/api/auth/details");
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },

  // Get user sessions
  getSessions: async (): Promise<Session[]> => {
    const response = await api.get("/api/auth/sessions");
    return response.data;
  },

  // Logout all devices
  logoutAllDevices: async (): Promise<{ message: string }> => {
    const response = await api.delete("/api/auth/sessions");
    return response.data;
  },

  // Logout specific device
  logoutDevice: async (sessionId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/auth/sessions/${sessionId}`);
    return response.data;
  },

  // Get session stats
  getSessionStats: async (): Promise<SessionStats> => {
    const response = await api.get("/api/auth/sessions/stats");
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post("/api/auth/resend-verification", { email });
    return response.data;
  },
};
