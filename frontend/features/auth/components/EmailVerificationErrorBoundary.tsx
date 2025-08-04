'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class EmailVerificationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Email Verification Error Boundary caught an error:', error, errorInfo)

    // Log error to monitoring service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoToSignIn = () => {
    window.location.href = '/auth/signin'
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  We encountered an error while loading the email verification page.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </AlertDescription>
                </Alert>

                {/* Development error details */}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <Alert>
                    <AlertDescription>
                      <details className="whitespace-pre-wrap text-xs">
                        <summary className="cursor-pointer font-medium mb-2">
                          Error Details (Development)
                        </summary>
                        {this.state.errorInfo}
                      </details>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    size="lg"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={this.handleGoToSignIn}
                      variant="outline"
                      size="sm"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      size="sm"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 mt-6">
                  <p>
                    If this problem persists, please{' '}
                    <a href="/contact" className="text-blue-600 hover:text-blue-500">
                      contact support
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default EmailVerificationErrorBoundary
