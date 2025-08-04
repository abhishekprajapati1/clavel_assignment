'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailVerificationStatus } from '@/features/auth/components/EmailVerificationStatus'
import { ResendVerificationForm } from '@/features/auth/components/ResendVerificationForm'
import { useEmailVerification, useResendVerification } from '@/features/auth/hooks/useEmailVerification'
import { validateEmailVerificationToken, extractEmailFromToken, debugToken } from '@/features/auth/utils/jwt'

const TestVerificationPage: React.FC = () => {
  const [testToken, setTestToken] = useState('')
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [currentView, setCurrentView] = useState<'status' | 'resend' | 'utils'>('status')
  const [tokenInfo, setTokenInfo] = useState<any>(null)

  const {
    isLoading: isVerifying,
    isSuccess: verificationSuccess,
    isError: verificationError,
    error: verificationErrorMessage,
    message: verificationMessage,
    verifyEmail,
    reset: resetVerification
  } = useEmailVerification()

  const {
    isLoading: isResending,
    isSuccess: resendSuccess,
    isError: resendError,
    error: resendErrorMessage,
    message: resendMessage,
    resendVerification,
    reset: resetResend
  } = useResendVerification()

  const handleTestVerification = async () => {
    if (!testToken) {
      alert('Please enter a test token')
      return
    }

    try {
      await verifyEmail(testToken)
    } catch (error) {
      console.error('Test verification failed:', error)
    }
  }

  const handleTestResend = async () => {
    if (!testEmail) {
      alert('Please enter a test email')
      return
    }

    try {
      await resendVerification(testEmail)
    } catch (error) {
      console.error('Test resend failed:', error)
    }
  }

  const analyzeToken = () => {
    if (!testToken) {
      alert('Please enter a token to analyze')
      return
    }

    const validation = validateEmailVerificationToken(testToken)
    const email = extractEmailFromToken(testToken)

    setTokenInfo({
      validation,
      email,
      isValid: validation.isValid,
      isExpired: validation.isExpired,
      error: validation.error
    })

    // Debug in console
    debugToken(testToken)
  }

  const generateSampleTokens = () => {
    // These are sample tokens for testing (not real)
    const samples = {
      valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0eXBlIjoidmVyaWZpY2F0aW9uIiwiZXhwIjo5OTk5OTk5OTk5fQ.sample',
      expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0eXBlIjoidmVyaWZpY2F0aW9uIiwiZXhwIjoxNjAwMDAwMDAwfQ.sample',
      invalid: 'invalid.token.format'
    }
    return samples
  }

  const sampleTokens = generateSampleTokens()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Email Verification Feature Test
        </h1>
        <p className="text-gray-600">
          Test the email verification components and functionality
        </p>
      </div>

      {/* Navigation */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={currentView === 'status' ? 'default' : 'outline'}
          onClick={() => setCurrentView('status')}
        >
          Status Component
        </Button>
        <Button
          variant={currentView === 'resend' ? 'default' : 'outline'}
          onClick={() => setCurrentView('resend')}
        >
          Resend Component
        </Button>
        <Button
          variant={currentView === 'utils' ? 'default' : 'outline'}
          onClick={() => setCurrentView('utils')}
        >
          JWT Utils
        </Button>
      </div>

      {/* Status Component Test */}
      {currentView === 'status' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Verification Status Component</CardTitle>
              <CardDescription>
                Test different states of the EmailVerificationStatus component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Token:</label>
                <Input
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Enter JWT token to test verification"
                  className="mb-2"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleTestVerification} disabled={isVerifying}>
                    {isVerifying ? 'Verifying...' : 'Test Verification'}
                  </Button>
                  <Button onClick={resetVerification} variant="outline">
                    Reset
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Quick test tokens:</p>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTestToken(sampleTokens.valid)}
                  >
                    Valid Token
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTestToken(sampleTokens.expired)}
                  >
                    Expired Token
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTestToken(sampleTokens.invalid)}
                  >
                    Invalid Token
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Display */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">Component Preview:</p>
            <div className="min-h-[400px]">
              <EmailVerificationStatus
                status={
                  isVerifying ? 'loading' :
                  verificationSuccess ? 'success' :
                  verificationError ? 'error' :
                  'invalid'
                }
                message={verificationMessage}
                error={verificationErrorMessage}
                email={extractEmailFromToken(testToken)}
                onResendVerification={() => console.log('Resend clicked')}
                onRetry={() => console.log('Retry clicked')}
                isResending={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Resend Component Test */}
      {currentView === 'resend' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Resend Verification Component</CardTitle>
              <CardDescription>
                Test the ResendVerificationForm component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Email:</label>
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to test resend"
                  type="email"
                  className="mb-2"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleTestResend} disabled={isResending}>
                    {isResending ? 'Sending...' : 'Test Resend'}
                  </Button>
                  <Button onClick={resetResend} variant="outline">
                    Reset
                  </Button>
                </div>
              </div>

              {resendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">{resendMessage}</p>
                </div>
              )}

              {resendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800">{resendErrorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resend Form Display */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">Component Preview:</p>
            <div className="max-w-md">
              <ResendVerificationForm
                initialEmail={testEmail}
                onSuccess={(email) => console.log('Form success:', email)}
                onCancel={() => console.log('Form cancelled')}
                showCancel={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* JWT Utils Test */}
      {currentView === 'utils' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test JWT Utilities</CardTitle>
              <CardDescription>
                Test JWT token parsing and validation utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token to Analyze:</label>
                <Input
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Enter JWT token to analyze"
                  className="mb-2"
                />
                <Button onClick={analyzeToken}>
                  Analyze Token
                </Button>
              </div>

              {tokenInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-sm mb-2">Validation Result</h4>
                      <div className="text-sm space-y-1">
                        <p>Valid: <span className={tokenInfo.isValid ? 'text-green-600' : 'text-red-600'}>
                          {tokenInfo.isValid ? 'Yes' : 'No'}
                        </span></p>
                        <p>Expired: <span className={tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'}>
                          {tokenInfo.isExpired ? 'Yes' : 'No'}
                        </span></p>
                        {tokenInfo.error && (
                          <p>Error: <span className="text-red-600">{tokenInfo.error}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-sm mb-2">Extracted Data</h4>
                      <div className="text-sm space-y-1">
                        <p>Email: <span className="font-mono">{tokenInfo.email || 'None'}</span></p>
                      </div>
                    </div>
                  </div>

                  {tokenInfo.validation.payload && (
                    <div className="p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-sm mb-2">Full Payload</h4>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(tokenInfo.validation.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900">Status Component Testing:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Use sample tokens to test different verification states</li>
              <li>Check loading, success, error, and expired states</li>
              <li>Test resend and retry functionality</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Resend Component Testing:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter a valid email address</li>
              <li>Test form validation and submission</li>
              <li>Check success and error states</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">JWT Utils Testing:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Paste any JWT token to analyze its structure</li>
              <li>Check validation, expiration, and data extraction</li>
              <li>View detailed token information in browser console</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestVerificationPage
