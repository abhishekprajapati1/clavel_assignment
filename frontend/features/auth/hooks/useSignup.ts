import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

const useSignup = () => {
    const router = useRouter();
    return useMutation({
        mutationFn: authApi.signUp,
        onSuccess: () => {
          toast.success('Account created successfully! Please check your email for verification.')
          router.push('/auth/signin')
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.detail || 'Failed to create account')
        },
      })
}
export default useSignup;