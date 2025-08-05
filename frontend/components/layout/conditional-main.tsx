"use client";

import { usePathname } from "next/navigation";

interface ConditionalMainProps {
  children: React.ReactNode;
}

export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();

  // Check if navbar should be hidden (same logic as in navbar component)
  const isAuthPage =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/resend-verification");

  return (
    <main className={isAuthPage ? "" : "pt-16"}>
      {children}
    </main>
  );
}
