"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";
import { cn } from "cn";

const navLinks = [
  { href: siteConfig.routes.home, label: "Home" },
  { href: siteConfig.routes.services, label: "Browse Services" },
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

function UserAvatar({ size = "sm" }: { size?: "sm" | "default" }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Avatar size={size}>
        <AvatarFallback>
          <span className="sr-only">No user</span>
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size={size}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback>{getInitials(user.name) || <span className="sr-only">{user.name}</span>}</AvatarFallback>
    </Avatar>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, signOut, role } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const dashboardHref =
    role === "admin"
      ? siteConfig.dashboards.admin
      : role === "vendor"
        ? siteConfig.dashboards.vendor
        : siteConfig.dashboards.customer;

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Logo />

        {/* Desktop: public + authenticated nav links */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop: auth actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="gap-2 pl-1 pr-2" aria-label="Open user menu" />}
              >
                <UserAvatar />
                <span className="max-w-32 truncate text-sm font-medium">{user.name}</span>
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {/* User name and profile image */}
                <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                  <UserAvatar size="default" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      {user.role && (
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {user.role}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(dashboardHref)}>
                  <LayoutDashboard aria-hidden="true" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(siteConfig.routes.profile)}>
                  <Settings aria-hidden="true" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                  <LogOut aria-hidden="true" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" render={<Link href={siteConfig.routes.signIn} />}>
                Sign In
              </Button>
              <Button render={<Link href={siteConfig.routes.signUp} />}>Sign Up</Button>
            </>
          )}
        </div>

        {/* Mobile: hamburger + sheet menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80 max-w-[85vw]">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-heading text-lg font-semibold tracking-tight">
                {siteConfig.name}
              </SheetTitle>
            </SheetHeader>

            <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2.5 pb-2">
                    <UserAvatar size="default" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        {user.role && (
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={dashboardHref}
                        onClick={() => setMobileOpen(false)}
                        className="w-full"
                      />
                    }
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={siteConfig.routes.profile}
                        onClick={() => setMobileOpen(false)}
                        className="w-full"
                      />
                    }
                  >
                    Profile Settings
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                    <LogOut aria-hidden="true" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={siteConfig.routes.signIn}
                        onClick={() => setMobileOpen(false)}
                        className="w-full"
                      />
                    }
                  >
                    Sign In
                  </Button>
                  <Button
                    render={
                      <Link
                        href={siteConfig.routes.signUp}
                        onClick={() => setMobileOpen(false)}
                        className="w-full"
                      />
                    }
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
