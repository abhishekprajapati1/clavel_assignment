'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { ToastContainer, useToastNotifications, ToastNotification } from '@/features/auth/components/VerificationToast'

interface ToastContextType {
  notifications: ToastNotification[]
  addNotification: (notification: Omit<ToastNotification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  showSuccess: (title: string, message: string, options?: Partial<ToastNotification>) => string
  showError: (title: string, message: string, options?: Partial<ToastNotification>) => string
  showWarning: (title: string, message: string, options?: Partial<ToastNotification>) => string
  showInfo: (title: string, message: string, options?: Partial<ToastNotification>) => string
  // Verification-specific methods
  showVerificationSuccess: () => string
  showVerificationError: (errorMessage?: string) => string
  showResendSuccess: (email: string) => string
  showResendError: (errorMessage?: string) => string
  showTokenExpired: () => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right'
}) => {
  const toastMethods = useToastNotifications()

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer
        notifications={toastMethods.notifications}
        onDismiss={toastMethods.removeNotification}
        position={position}
      />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience hook for common toast operations
export const useNotify = () => {
  const toast = useToast()

  return {
    success: (message: string, title = 'Success') =>
      toast.showSuccess(title, message),

    error: (message: string, title = 'Error') =>
      toast.showError(title, message),

    warning: (message: string, title = 'Warning') =>
      toast.showWarning(title, message),

    info: (message: string, title = 'Info') =>
      toast.showInfo(title, message),

    // Auth-specific notifications
    verificationSuccess: () => toast.showVerificationSuccess(),
    verificationError: (error?: string) => toast.showVerificationError(error),
    resendSuccess: (email: string) => toast.showResendSuccess(email),
    resendError: (error?: string) => toast.showResendError(error),
    tokenExpired: () => toast.showTokenExpired(),
  }
}

export default ToastProvider
