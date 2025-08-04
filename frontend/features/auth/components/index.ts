// Auth Components Index
// Export all authentication components for easier importing

export { EmailVerificationStatus } from './EmailVerificationStatus'
export { ResendVerificationForm } from './ResendVerificationForm'
export { EmailVerificationErrorBoundary } from './EmailVerificationErrorBoundary'

// Re-export types if needed
export type {
  EmailVerificationStatusProps
} from './EmailVerificationStatus'

// Default exports
export { default as EmailVerificationStatusDefault } from './EmailVerificationStatus'
export { default as ResendVerificationFormDefault } from './ResendVerificationForm'
export { default as EmailVerificationErrorBoundaryDefault } from './EmailVerificationErrorBoundary'
