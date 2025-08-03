import axios from 'axios'
import { TemplateListResponse, CreateTemplateData, UpdateTemplateData } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const templatesApi = {
  // Get all templates
  getTemplates: async (page: number = 1, perPage: number = 10): Promise<TemplateListResponse> => {
    const response = await api.get('/api/templates', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  // Get template by ID
  getTemplate: async (id: string) => {
    const response = await api.get(`/api/templates/${id}`)
    return response.data
  },

  // Create template (admin only)
  createTemplate: async (data: CreateTemplateData) => {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) {
      formData.append('description', data.description)
    }
    formData.append('image', data.image)

    const response = await api.post('/api/templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Update template
  updateTemplate: async (id: string, data: UpdateTemplateData) => {
    const response = await api.put(`/api/templates/${id}`, data)
    return response.data
  },

  // Delete template
  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/api/templates/${id}`)
    return response.data
  },

  // Get user's templates
  getMyTemplates: async (page: number = 1, perPage: number = 10): Promise<TemplateListResponse> => {
    const response = await api.get('/api/templates/my/templates', {
      params: { page, per_page: perPage }
    })
    return response.data
  },
} 