import type { Metadata } from "next";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Shared shell for every authenticated planning route (/dashboard/*):
 * sticky desktop sidebar + horizontal pill nav on small screens,
 * with the page content beside it.
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
          <DashboardSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
