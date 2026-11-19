"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, type UserRole } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const router = useRouter();
  const { role, isPending, isAuthenticated } = useAuth();
  const allowedRolesKey = allowedRoles ? allowedRoles.join(",") : "";

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        router.replace(
          `${siteConfig.routes.signIn}?callbackURL=${encodeURIComponent(
            window.location.pathname
          )}`
        );
      } else {
        router.replace(siteConfig.routes.signIn);
      }
      return;
    }

    if (allowedRolesKey) {
      const roles = allowedRolesKey.split(",") as UserRole[];
      if (!role || !roles.includes(role)) {
        const fallback =
          role === "admin"
            ? siteConfig.dashboards.admin
            : role === "vendor"
              ? siteConfig.dashboards.vendor
              : siteConfig.dashboards.customer;
        router.replace(fallback);
      }
    }
  }, [isPending, isAuthenticated, role, allowedRolesKey, router]);

  if (isPending || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Checking authentication…</p>
      </div>
    );
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Verifying permissions…</p>
      </div>
    );
  }

  return <>{children}</>;
}
