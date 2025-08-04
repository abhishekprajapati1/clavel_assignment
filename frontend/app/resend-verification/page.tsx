'use client'

import React from 'react'
import { ResendVerificationForm } from '@/features/auth/components/ResendVerificationForm'

const ResendVerificationPage: React.FC = () => {
  const handleSuccess = (email: string) => {
    // Redirect to a success page or show success message
    // You could also redirect back to sign-in with a message
    console.log('Verification email sent to:', email)
  }

  const handleCancel = () => {
    // Redirect back to sign-in page
    window.location.href = '/auth/signin'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <ResendVerificationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          showCancel={true}
          className="shadow-lg"
        />
      </div>
    </div>
  )
}

export default ResendVerificationPage
