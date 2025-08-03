'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function PaymentPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      // Redirect to success page
      router.push('/payment/success')
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Complete Payment</CardTitle>
          <CardDescription>
            Unlock access to protected content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Content Access</span>
                <span className="font-medium">$9.99</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>$9.99</span>
              </div>
            </div>

            <div>
              <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <Input
                id="card-number"
                placeholder="4242 4242 4242 4242"
                defaultValue="4242 4242 4242 4242"
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  defaultValue="12/25"
                  disabled
                />
              </div>
              <div>
                <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <Input
                  id="cvc"
                  placeholder="123"
                  defaultValue="123"
                  disabled
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Test Mode:</strong> This is a demo payment. Use any test card number to proceed.
              </p>
            </div>

            <Button
              onClick={handlePayment}
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay $9.99'}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 