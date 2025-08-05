import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const useSignin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      toast.success("Signed in successfully!");
      console.log("see this", data.user);
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to sign in");
    },
  });
};
export default useSignin;
