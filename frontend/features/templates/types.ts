export interface Template {
  id: string
  title: string
  description?: string
  image_url: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface TemplateListResponse {
  templates: Template[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface CreateTemplateData {
  title: string
  description?: string
  image: File
}

export interface UpdateTemplateData {
  title?: string
  description?: string
} 