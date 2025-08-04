'use client'

import { useState, useCallback } from 'react'
import { authApi } from '../api'

export interface EmailVerificationState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  message: string | null
}

export interface ResendVerificationState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  message: string | null
}

export const useEmailVerification = () => {
  const [state, setState] = useState<EmailVerificationState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    message: null,
  })

  const verifyEmail = useCallback(async (token: string) => {
    setState({
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      message: null,
    })

    try {
      const response = await authApi.verifyEmail(token)
      setState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        message: response.message,
      })
      return response
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
                          error.message ||
                          'Email verification failed'

      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        message: null,
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      message: null,
    })
  }, [])

  return {
    ...state,
    verifyEmail,
    reset,
  }
}

export const useResendVerification = () => {
  const [state, setState] = useState<ResendVerificationState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    message: null,
  })

  const resendVerification = useCallback(async (email: string) => {
    setState({
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      message: null,
    })

    try {
      const response = await authApi.resendVerification(email)
      setState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        message: response.message,
      })
      return response
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
                          error.message ||
                          'Failed to resend verification email'

      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        message: null,
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      message: null,
    })
  }, [])

  return {
    ...state,
    resendVerification,
    reset,
  }
}
