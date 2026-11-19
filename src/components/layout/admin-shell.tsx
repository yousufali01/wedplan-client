"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminSidebarContent } from "@/components/layout/admin-sidebar";
import { CopyrightYear } from "@/components/layout/copyright-year";
import { siteConfig } from "@/config/site";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-[#faf9f6] text-foreground">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2" title="Go to WedPlan Home">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <span className="font-heading text-xl font-bold">WedPlan Admin</span>
          </Link>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
        </header>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[290px] gap-0 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Portal Navigation</SheetTitle>
            </SheetHeader>
            <div className="h-full p-4">
              <AdminSidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:gap-8 lg:p-8">
          {/* Desktop sidebar — fixed in place while content scrolls */}
          <aside className="hidden w-full shrink-0 lg:block lg:w-[260px]">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <AdminSidebarContent />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {children}

            <footer className="mt-10 border-t border-[#e9e1d8] py-5">
              <div className="flex flex-col justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
                <p suppressHydrationWarning>
                  © <CopyrightYear /> {siteConfig.name} Admin Portal. All rights reserved.
                </p>
                <p>Enterprise Platform Governance & Security</p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
