"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CircleDollarSign,
  ExternalLink,
  LayoutDashboard,
  ListChecks,
  Settings,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { siteConfig } from "@/config/site";
import { cn } from "cn";

const planningNav = [
  { href: siteConfig.routes.dashboard, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: siteConfig.routes.budget, label: "Budget", icon: CircleDollarSign },
  { href: siteConfig.routes.checklist, label: "Checklist", icon: ListChecks },
  { href: siteConfig.routes.bookings, label: "Bookings", icon: CalendarCheck },
] as const;

const accountNav = [
  { href: siteConfig.routes.profile, label: "Profile Settings", icon: Settings },
  { href: siteConfig.routes.services, label: "Browse Services", icon: ExternalLink },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type NavItemData = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({ href, label, icon: Icon, exact }: NavItemData) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile: horizontal scrollable pill nav */}
      <nav
        aria-label="Dashboard navigation"
        className="flex gap-1 overflow-x-auto pb-1 lg:hidden"
      >
        {[...planningNav, ...accountNav].map(({ href, label, icon: Icon, ...rest }) => {
          const active = isActive(pathname, href, "exact" in rest ? rest.exact : undefined);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: sticky sidebar */}
      <aside className="sticky top-24 hidden self-start lg:flex lg:flex-col lg:gap-8">
        <nav aria-label="Dashboard planning navigation" className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Planning
          </p>
          {planningNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <nav aria-label="Dashboard account navigation" className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          {accountNav.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} icon={Icon} />
          ))}
        </nav>

        {/* Signed-in user block */}
        {user && (
          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm">
            <Avatar>
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback>
                {getInitials(user.name) || <span className="sr-only">{user.name}</span>}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
