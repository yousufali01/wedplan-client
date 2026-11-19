"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Globe,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const adminNavigation = [
  {
    label: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Manage Services",
    href: "/admin/services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: Receipt,
  },
  {
    label: "View Website",
    href: "/",
    icon: Globe,
    exact: true,
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string) {
  if (!name) return "AD";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminSidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [pendingVendorsCount, setPendingVendorsCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    void apiRequest<{ vendors?: unknown[]; total?: number }>(
      "/api/v1/admin/vendors/pending"
    )
      .then((res) => {
        if (cancelled) return;
        setPendingVendorsCount(res.total ?? res.vendors?.length ?? 0);
      })
      .catch(() => {
        // Silently catch in sidebar
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#e9e1d8] bg-white p-4 shadow-sm">
      {/* Workspace Header */}
      <div className="border-b border-[#e9e1d8] pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-muted-foreground">
          Workspace
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <h2 className="font-heading text-xl font-semibold">Admin Portal</h2>
          </div>

          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            Admin
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-muted-foreground">
          {user?.name || "Administrator"} ({user?.email || "admin@wedplan.com"})
        </p>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex flex-col gap-2" aria-label="Admin navigation">
        {adminNavigation.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`
                flex items-center gap-3 rounded-xl px-3 py-3
                text-sm font-medium transition-all duration-200
                ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                }
              `}
            >
              <Icon className="size-[17px] shrink-0" />
              <span>{item.label}</span>

              {item.label === "Manage Users" && pendingVendorsCount > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {pendingVendorsCount} pending
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Administrator Info Card */}
      <div className="mt-auto rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.name} />}
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {user?.name || "System Administrator"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Super Admin Control
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
