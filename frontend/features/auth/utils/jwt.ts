/**
 * JWT Utility Functions for Email Verification
 * Provides safe JWT token parsing and validation utilities
 */

export interface JWTPayload {
  email?: string;
  type?: string;
  exp?: number;
  iat?: number;
  user_id?: string;
  role?: string;
  [key: string]: any;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload: JWTPayload | null;
  error: string | null;
  isExpired: boolean;
}

/**
 * Safely decode a JWT token without verification
 * This is for client-side display purposes only - never trust this for authentication
 */
export const decodeJWTToken = (token: string): TokenValidationResult => {
  try {
    // Validate token format
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        isValid: false,
        payload: null,
        error: "Invalid token format",
        isExpired: false,
      };
    }

    // Decode the payload (second part)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload: JWTPayload = JSON.parse(jsonPayload);

    // Check if token is expired
    const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;

    return {
      isValid: true,
      payload,
      error: null,
      isExpired,
    };
  } catch (error) {
    return {
      isValid: false,
      payload: null,
      error: error instanceof Error ? error.message : "Failed to decode token",
      isExpired: false,
    };
  }
};

/**
 * Extract email from a JWT token safely
 */
export const extractEmailFromToken = (token: string): string => {
  const result = decodeJWTToken(token);
  return result.payload?.email || "";
};

/**
 * Extract user ID from a JWT token safely
 */
export const extractUserIdFromToken = (token: string): string => {
  const result = decodeJWTToken(token);
  return result.payload?.user_id || "";
};

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const result = decodeJWTToken(token);
  return result.isExpired;
};

/**
 * Get token type (access, refresh, verification, reset, etc.)
 */
export const getTokenType = (token: string): string => {
  const result = decodeJWTToken(token);
  return result.payload?.type || "unknown";
};

/**
 * Validate if token is of expected type
 */
export const isTokenOfType = (token: string, expectedType: string): boolean => {
  const tokenType = getTokenType(token);
  return tokenType === expectedType;
};

/**
 * Get human-readable expiration time
 */
export const getTokenExpirationTime = (token: string): Date | null => {
  const result = decodeJWTToken(token);
  if (!result.payload?.exp) return null;
  return new Date(result.payload.exp * 1000);
};

/**
 * Get time until token expires in milliseconds
 */
export const getTimeUntilExpiration = (token: string): number => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  return Math.max(0, expirationTime.getTime() - Date.now());
};

/**
 * Format time remaining in human-readable format
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return "Expired";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `${seconds} second${seconds > 1 ? "s" : ""}`;
};

/**
 * Validate email verification token specifically
 */
export const validateEmailVerificationToken = (
  token: string,
): TokenValidationResult => {
  const result = decodeJWTToken(token);

  if (!result.isValid) {
    return result;
  }

  // Additional validation for email verification tokens
  if (!result.payload?.email) {
    return {
      isValid: false,
      payload: result.payload,
      error: "Token does not contain email",
      isExpired: result.isExpired,
    };
  }

  if (result.payload.type !== "verification") {
    return {
      isValid: false,
      payload: result.payload,
      error: "Token is not a verification token",
      isExpired: result.isExpired,
    };
  }

  return result;
};

/**
 * Validate password reset token specifically
 */
export const validateResetToken = (token: string): TokenValidationResult => {
  const result = decodeJWTToken(token);

  if (!result.isValid) {
    return result;
  }

  // Additional validation for reset tokens
  if (!result.payload?.email) {
    return {
      isValid: false,
      payload: result.payload,
      error: "Token does not contain email",
      isExpired: result.isExpired,
    };
  }

  if (result.payload.type !== "reset") {
    return {
      isValid: false,
      payload: result.payload,
      error: "Token is not a reset token",
      isExpired: result.isExpired,
    };
  }

  return result;
};

/**
 * Get error message for common JWT validation failures
 */
export const getJWTErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    "Invalid token format":
      "The verification link appears to be malformed. Please check the link or request a new one.",
    "Failed to decode token":
      "Unable to read the verification token. The link may be corrupted.",
    "Token does not contain email":
      "The verification link is missing required information.",
    "Token is not a verification token":
      "This link is not a valid email verification link.",
  };

  return (
    errorMap[error] ||
    "An error occurred while processing the verification link."
  );
};

/**
 * Debug function to log token information (development only)
 */
export const debugToken = (token: string): void => {
  if (process.env.NODE_ENV !== "development") return;

  const result = decodeJWTToken(token);
  console.group("🔍 JWT Token Debug");
  console.log("Token:", token.substring(0, 50) + "...");
  console.log("Valid:", result.isValid);
  console.log("Expired:", result.isExpired);
  console.log("Payload:", result.payload);
  console.log("Error:", result.error);

  if (result.payload?.exp) {
    const expTime = new Date(result.payload.exp * 1000);
    console.log("Expires:", expTime.toLocaleString());
    console.log(
      "Time remaining:",
      formatTimeRemaining(getTimeUntilExpiration(token)),
    );
  }

  console.groupEnd();
};
