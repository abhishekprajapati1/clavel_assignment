'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const createTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>

interface CreateTemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTemplateModal({ isOpen, onClose }: CreateTemplateModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { createTemplate, isCreating } = useTemplates()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const onSubmit = async (data: CreateTemplateFormData) => {
    if (!selectedFile) {
      alert('Please select an image file')
      return
    }

    try {
      await createTemplate({
        title: data.title,
        description: data.description,
        image: selectedFile,
      })
      
      // Reset form and close modal
      reset()
      setSelectedFile(null)
      setPreviewUrl(null)
      onClose()
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Template</CardTitle>
          <CardDescription>
            Add a new template for users to view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                id="title"
                placeholder="Enter template title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Input
                id="description"
                placeholder="Enter template description"
                {...register('description')}
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !selectedFile}
                className="flex-1"
              >
                {isCreating ? 'Uploading...' : 'Upload Template'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 