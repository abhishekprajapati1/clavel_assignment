'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { authApi } from '../api'

function useLoggedInUser() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getUserDetails,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    user,
    isLoadingUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  }
} 
export default useLoggedInUser;