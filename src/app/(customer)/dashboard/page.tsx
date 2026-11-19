"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";
import { apiRequest } from "@/lib/api";

type Booking = {
  _id?: string;
  id?: string;
  serviceId?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceImage?: string;
  servicePrice?: number | string;
  eventDate?: string;
  status?: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt?: string;
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: XCircle,
  },
} as const;

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    label: status,
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch recent 5 bookings
  React.useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setIsLoading(true);
      apiRequest<{ bookings: Booking[] }>("/api/v1/bookings/mine")
        .then((res) => setBookings(res.bookings?.slice(0, 5) ?? []))
        .catch(() => setBookings([]))
        .finally(() => setIsLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [user]);

  const stats = React.useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const accepted = bookings.filter((b) => b.status === "accepted").length;
    return { total, pending, accepted };
  }, [bookings]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <section className="flex flex-col gap-8">
      {/* ─── Welcome Header ─── */}
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Planning overview
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {firstName} 👋
        </h1>
        <p className="max-w-lg text-balance text-muted-foreground">
          Track your wedding bookings, manage your plans, and browse new
          services — all in one place.
        </p>
      </header>

      {/* ─── Quick Action Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href={siteConfig.routes.services}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Search className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Browse Services
            </h2>
            <p className="text-sm text-muted-foreground">
              Search photographers, venues, caterers & more.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
            Explore <ArrowRight className="size-3.5" />
          </span>
        </Link>

        <Link
          href={siteConfig.routes.bookings}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
            <CalendarCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              My Bookings
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your booking requests and statuses.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
            View all <ArrowRight className="size-3.5" />
          </span>
        </Link>

        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-card p-5 shadow-sm opacity-70">
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Checklist
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep every planning task on schedule.
            </p>
          </div>
          <span className="mt-auto w-fit rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
            Coming soon
          </span>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      {!isLoading && bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Recent Bookings",
              value: stats.total,
              sub: "last shown",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              sub: "awaiting vendor",
            },
            {
              label: "Confirmed",
              value: stats.accepted,
              sub: "vendor accepted",
            },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 text-center shadow-sm"
            >
              <p className="font-heading text-3xl font-bold text-primary">
                {value}
              </p>
              <p className="mt-0.5 text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Recent Bookings Section ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Recent Bookings
          </h2>
          {bookings.length > 0 && (
            <Link
              href={siteConfig.routes.bookings}
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CalendarCheck className="size-7" />
            </span>
            <div>
              <p className="font-heading text-lg font-semibold">
                No bookings yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse wedding services and send your first booking request.
              </p>
            </div>
            <Link
              href={siteConfig.routes.services}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {bookings.map((booking) => (
              <div
                key={booking._id ?? booking.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Service image thumbnail */}
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {booking.serviceImage ? (
                    <div
                      className="size-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${booking.serviceImage}')`,
                      }}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <CalendarCheck className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {booking.serviceName ?? "Wedding Service"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Event: {formatDate(booking.eventDate)} ·{" "}
                    {booking.serviceCategory ?? "Service"}
                  </p>
                </div>

                {/* Status badge */}
                <StatusBadge status={booking.status ?? "pending"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
