'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { templatesApi } from '../api'
import { CreateTemplateData, UpdateTemplateData } from '../types'

export function useTemplates(page: number = 1, perPage: number = 10) {
  const queryClient = useQueryClient()

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates', page, perPage],
    queryFn: () => templatesApi.getTemplates(page, perPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createTemplateMutation = useMutation({
    mutationFn: templatesApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create template')
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateData }) =>
      templatesApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update template')
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: templatesApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete template')
    },
  })

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  }
}

export function useMyTemplates(page: number = 1, perPage: number = 10) {
  const queryClient = useQueryClient()

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['my-templates', page, perPage],
    queryFn: () => templatesApi.getMyTemplates(page, perPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    templates,
    isLoading,
    error,
  }
} 