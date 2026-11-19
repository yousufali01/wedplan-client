"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/layout/logo";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, isPending, isAuthenticated, refetch } = useAuth();
  const processingRoleRef = React.useRef(false);

  React.useEffect(() => {
    if (isPending || processingRoleRef.current) return;

    if (!isAuthenticated) {
      // Allow a brief moment for the session cookie to be recognized
      const timeout = setTimeout(() => {
        router.replace(siteConfig.routes.signIn);
      }, 2500);
      return () => clearTimeout(timeout);
    }

    if (!user) return;

    const requestedRole = searchParams.get("role");

    // If new user requested to be a vendor and is currently a customer
    if (requestedRole === "vendor" && role === "customer") {
      processingRoleRef.current = true;
      apiRequest("/api/v1/profile/apply-vendor", { method: "POST" })
        .then(() => refetch())
        .catch((err) => console.error("Vendor role application:", err))
        .finally(() => {
          router.replace(siteConfig.dashboards.vendor);
        });
      return;
    }

    // If user has a specific redirect target (e.g. service details page)
    const redirectTarget = searchParams.get("redirect") || searchParams.get("callbackURL");
    if (
      redirectTarget &&
      redirectTarget.startsWith("/") &&
      !redirectTarget.startsWith("//")
    ) {
      router.replace(redirectTarget);
      return;
    }

    // Role-based routing
    if (role === "admin") {
      router.replace(siteConfig.dashboards.admin);
    } else if (role === "vendor") {
      router.replace(siteConfig.dashboards.vendor);
    } else {
      router.replace(siteConfig.dashboards.customer);
    }
  }, [
    isPending,
    isAuthenticated,
    user,
    role,
    searchParams,
    router,
    refetch,
  ]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo />
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span className="font-heading text-lg font-medium">
            Completing your sign in…
          </span>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Setting up your wedding dashboard and preparing your workspace.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </React.Suspense>
  );
}
