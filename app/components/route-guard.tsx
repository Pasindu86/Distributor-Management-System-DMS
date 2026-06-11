"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login unless already there
        if (pathname !== "/login") {
          router.push("/login");
        }
      } else if (requireAdmin && role !== "admin") {
        // User is logged in but doesn't have admin access
        router.push("/home");
      } else if (pathname === "/login" && user) {
        // Logged in user shouldn't see login page
        router.push("/home");
      }
    }
  }, [user, role, loading, router, pathname, requireAdmin]);

  // Show a loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--dms-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--dms-primary)] border-t-transparent" />
      </div>
    );
  }

  // If not logged in and we are not on login page, don't render children yet
  if (!user && pathname !== "/login") {
    return null; 
  }

  // If requires admin but not admin, don't render children
  if (requireAdmin && role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
