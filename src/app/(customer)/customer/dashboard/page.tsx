"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { siteConfig } from "@/config/site";

export default function CustomerDashboardPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace(siteConfig.routes.dashboard);
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={["customer", "admin"]}>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Opening your wedding dashboard…</p>
      </div>
    </ProtectedRoute>
  );
}
