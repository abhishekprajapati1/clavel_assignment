"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useLoggedInUser from "@/features/auth/hooks/useLoggedInUser";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoadingUser } = useLoggedInUser();

  useEffect(() => {
    if (!isLoadingUser && user) {
      if (isAdmin) {
        // Redirect admin users to the new dashboard
        router.replace("/dashboard");
      } else {
        // Redirect non-admin users to templates
        router.replace("/templates");
      }
    } else if (!isLoadingUser && !user) {
      // Redirect unauthenticated users to signin
      router.replace("/signin");
    }
  }, [user, isAdmin, isLoadingUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
