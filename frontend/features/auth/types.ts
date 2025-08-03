export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'user'
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface SignInData {
  email: string
  password: string
}

export interface Session {
  id: string
  device_info: {
    user_agent: string
    browser: string
    os: string
    device: string
  }
  ip_address?: string
  is_active: boolean
  last_activity: string
  created_at: string
}

export interface SessionStats {
  total_sessions: number
  active_sessions: number
  inactive_sessions: number
  sessions_by_device: Record<string, number>
  sessions_by_browser: Record<string, number>
} 