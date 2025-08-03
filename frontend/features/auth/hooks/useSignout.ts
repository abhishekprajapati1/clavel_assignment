import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authApi } from "../api"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

const useSignout = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
          queryClient.clear()
          toast.success('Logged out successfully')
          router.push('/')
        },
        onError: (error: any) => {
          toast.error('Failed to logout')
          console.error('Logout error:', error)
        },
      })
}
export default useSignout;