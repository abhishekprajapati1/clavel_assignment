'use client'

import { useEffect, useState } from 'react'
import useLoggedInUser from '@/features/auth/hooks/useLoggedInUser'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScreenshotProtection } from '@/features/user/components/ScreenshotProtection'
import useSignout from '@/features/auth/hooks/useSignout'

export default function DashboardPage() {
  const { user, isAdmin } = useLoggedInUser()
  const { mutate: logout } = useSignout();
  const { templates, isLoading } = useTemplates()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user && isAdmin) {
      window.location.href = '/admin'
    }
  }, [user, isAdmin])

  const handleLogout = () => {
    logout()
  }

  const handleScreenshotAttempt = () => {
    setShowPaymentModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Templater</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.first_name} {user?.last_name}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
          <p className="text-gray-600">
            Browse and view templates uploaded by administrators
          </p>
        </div>

        {/* Screenshot Protection Wrapper */}
        <ScreenshotProtection onScreenshotAttempt={handleScreenshotAttempt}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.templates?.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${template.image_url}`}
                    alt={template.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>By {template.uploaded_by}</span>
                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates?.templates?.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
              <p className="text-gray-600">Templates will appear here once uploaded by administrators.</p>
            </div>
          )}
        </ScreenshotProtection>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Screenshot Detected</h2>
            <p className="text-gray-600 mb-6">
              Screenshot protection is enabled. To access this content, please complete the payment process.
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPaymentModal(false)
                  window.location.href = '/payment'
                }}
                className="flex-1"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 