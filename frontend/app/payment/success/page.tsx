'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
          <CardDescription className="text-green-600">
            Your payment has been processed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            You now have access to all protected content. You will be redirected to the dashboard shortly.
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Browse all available templates</li>
              <li>• Access protected content</li>
              <li>• Download and use templates</li>
            </ul>
          </div>

          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 