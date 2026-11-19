"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";
import { apiRequest } from "@/lib/api";
import { cancelDemoBooking, getDemoBookings } from "@/lib/demo-bookings";

/* ─── Types ─── */
type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";

type Booking = {
  _id?: string;
  id?: string;
  serviceId?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceImage?: string;
  servicePrice?: number | string;
  eventDate?: string;
  guestCount?: number | null;
  notes?: string;
  status?: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
  demo?: boolean;
};

/* ─── Status UI config ─── */
const STATUS_CFG: Record<
  BookingStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
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
};

const ALL_STATUSES: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

/* ─── Helpers ─── */
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

function formatPrice(price?: number | string) {
  if (price === undefined || price === null || price === "") return "—";
  if (typeof price === "string" && price.includes("৳")) return price;
  if (typeof price === "string" && price.includes("$")) return price;
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);
  return `৳${num.toLocaleString("en-BD")}`;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
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

/* ─── Booking Card ─── */
function BookingCard({
  booking,
  onCancel,
  cancellingId,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancellingId: string | null;
}) {
  const bookingId = booking._id ?? booking.id ?? "";
  const status = (booking.status ?? "pending") as BookingStatus;
  const isCancelling = cancellingId === bookingId;
  const canCancel = status === "pending";

  return (
    <div className="rounded-2xl border border-[#E8E1D3] bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Top colour stripe by status */}
      <div
        className={`h-1 w-full ${
          status === "pending"
            ? "bg-amber-400"
            : status === "accepted"
              ? "bg-emerald-500"
              : status === "rejected"
                ? "bg-red-400"
                : "bg-gray-300"
        }`}
      />

      <div className="flex gap-4 p-5">
        {/* Service image */}
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F0EB]">
          {booking.serviceImage ? (
            <div
              className="size-full bg-cover bg-center"
              style={{ backgroundImage: `url('${booking.serviceImage}')` }}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <CalendarCheck className="size-6 text-[#B4934C]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#183D2D]">
                {booking.serviceName ?? "Wedding Service"}
              </p>
              {booking.serviceCategory && (
                <p className="text-xs text-muted-foreground">
                  {booking.serviceCategory}
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarCheck className="size-3 text-primary" />
              Event: {formatDate(booking.eventDate)}
            </span>
            {booking.guestCount && (
              <span>Guests: {booking.guestCount}</span>
            )}
            <span>Package: {formatPrice(booking.servicePrice)}</span>
          </div>

          {booking.notes && (
            <p className="rounded-lg bg-[#FAF8F5] px-3 py-2 text-xs text-[#555E53] italic">
              &ldquo;{booking.notes}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EBE3] pt-3">
            <p className="text-[11px] text-muted-foreground">
              Requested on {formatDate(booking.createdAt)}
            </p>

            <div className="flex items-center gap-2">
              {booking.serviceId && (
                <Link
                  href={`/services/${booking.serviceId}`}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  View Service
                </Link>
              )}

              {canCancel && (
                <button
                  onClick={() => onCancel(bookingId)}
                  disabled={isCancelling}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  /* Filter + search state */
  const [statusFilter, setStatusFilter] = React.useState<BookingStatus | "all">("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  /* Auto-refresh interval for real-time vendor responses */
  const POLL_INTERVAL_MS = 10_000; // 10 seconds

  /* Track previous statuses to detect changes */
  const prevStatusesRef = React.useRef<Map<string, string>>(new Map());

  /* Fetch bookings */
  const fetchBookings = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    // Curated demo listings are stored locally; real ones come from the API.
    const demo = getDemoBookings(user.id) as Booking[];
    try {
      const res = await apiRequest<{ bookings: Booking[] }>(
        "/api/v1/bookings/mine"
      );
      const fresh = [...demo, ...(res.bookings ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      );

      // Check for status changes from pending → accepted/rejected
      if (prevStatusesRef.current.size > 0) {
        fresh.forEach((booking) => {
          const id = booking._id ?? booking.id ?? "";
          const prev = prevStatusesRef.current.get(id);
          const curr = booking.status ?? "pending";
          if (prev && prev !== curr && prev === "pending" && (curr === "accepted" || curr === "rejected")) {
            toast.success(
              curr === "accepted"
                ? `✅ Your booking for "${booking.serviceName || "Wedding Service"}" was accepted!`
                : `❌ Your booking for "${booking.serviceName || "Wedding Service"}" was declined.`,
              { duration: 6000 }
            );
          }
        });
      }

      // Update the status map
      const nextMap = new Map<string, string>();
      fresh.forEach((b) => {
        const id = b._id ?? b.id ?? "";
        if (id) nextMap.set(id, b.status ?? "pending");
      });
      prevStatusesRef.current = nextMap;

      setBookings(fresh);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load bookings.";
      setError(msg);
      setBookings(demo);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /* Initial load + polling for real-time vendor responses */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) await fetchBookings();
    };

    // Initial load
    const timer = setTimeout(() => void run(), 0);

    // Polling interval
    const interval = setInterval(() => void run(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchBookings]);

  /* Cancel handler */
  const handleCancel = React.useCallback(
    async (bookingId: string) => {
      if (!bookingId) return;
      setCancellingId(bookingId);
      try {
        if (bookingId.startsWith("demo-")) {
          if (!cancelDemoBooking(bookingId)) {
            toast.error("Only pending requests can be cancelled.");
            return;
          }
        } else {
          await apiRequest(`/api/v1/bookings/${bookingId}/cancel`, {
            method: "PATCH",
          });
        }
        toast.success("Booking cancelled successfully.");
        setBookings((prev) =>
          prev.map((b) =>
            (b._id ?? b.id) === bookingId
              ? { ...b, status: "cancelled" }
              : b
          )
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to cancel booking.";
        toast.error(msg);
      } finally {
        setCancellingId(null);
      }
    },
    []
  );

  /* Derived: filtered list */
  const filtered = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus =
        statusFilter === "all" || b.status === statusFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        (b.serviceName ?? "").toLowerCase().includes(q) ||
        (b.serviceCategory ?? "").toLowerCase().includes(q) ||
        (b.notes ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, statusFilter, searchTerm]);

  /* Stats */
  const stats = React.useMemo(() => {
    const counts: Record<BookingStatus | "all", number> = {
      all: bookings.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const b of bookings) {
      if (b.status && counts[b.status] !== undefined) {
        counts[b.status]++;
      }
    }
    return counts;
  }, [bookings]);

  return (
    <section className="flex flex-col gap-6">
      {/* ─── Header ─── */}
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Booking requests
        </span>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              My Bookings
            </h1>
            <p className="mt-1 max-w-lg text-balance text-muted-foreground">
              Track all your wedding service booking requests, check vendor
              responses, and cancel pending requests.
            </p>
          </div>
          <button
            onClick={() => void fetchBookings()}
            disabled={isLoading}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            aria-label="Refresh bookings"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      {/* ─── Stats pills ─── */}
      {!isLoading && bookings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                statusFilter === value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
              <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">
                {stats[value]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ─── Search + Filter Bar ─── */}
      {bookings.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex flex-1 min-w-48 items-center rounded-xl border border-[#E6DFD5] bg-white px-3 py-2 focus-within:border-primary transition">
            <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder="Search by service name, category or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="size-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BookingStatus | "all")
              }
              className="h-full appearance-none rounded-xl border border-[#E6DFD5] bg-white py-2 pl-3 pr-8 text-sm font-medium outline-none focus:border-primary cursor-pointer"
            >
              {ALL_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* ─── Loading ─── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your bookings…</p>
        </div>
      )}

      {/* ─── Error ─── */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => void fetchBookings()}
            className="ml-auto text-xs font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Empty state ─── */}
      {!isLoading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarCheck className="size-8" />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold">
              No bookings yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse wedding services and send your first booking request to
              get started.
            </p>
          </div>
          <Link
            href={siteConfig.routes.services}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Browse Services
          </Link>
        </div>
      )}

      {/* ─── Filtered empty ─── */}
      {!isLoading && !error && bookings.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No bookings match your current filter. Try a different status or
          search term.
        </div>
      )}

      {/* ─── Booking Cards ─── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((booking) => (
            <BookingCard
              key={booking._id ?? booking.id}
              booking={booking}
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          ))}
        </div>
      )}

      {/* ─── CTA if has bookings ─── */}
      {!isLoading && !error && bookings.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-primary text-sm">
              Looking for more wedding services?
            </p>
            <p className="text-xs text-muted-foreground">
              Browse our curated marketplace of verified wedding vendors.
            </p>
          </div>
          <Link
            href={siteConfig.routes.services}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/80 shrink-0"
          >
            Browse Services
          </Link>
        </div>
      )}
    </section>
  );
}
