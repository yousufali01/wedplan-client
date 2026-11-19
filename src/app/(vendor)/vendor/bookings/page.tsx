"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

type Booking = {
  _id: string;
  serviceId: string;
  serviceName?: string;
  customerName?: string;
  customerEmail?: string;
  eventDate?: string;
  guestCount?: number | null;
  notes?: string;
  serviceCategory?: string;
  serviceImage?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  price?: number;
  servicePrice?: number | string;
  createdAt?: string;
};

type StatusFilter = "all" | Booking["status"];

type SubscriptionInfo = {
  plan: string;
  status: string;
  planName?: string;
  isPremium?: boolean;
  expired?: boolean;
};

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

function statusStyle(status: Booking["status"]) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function VendorBookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<StatusFilter>("all");

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const [bookingsRes, subRes] = await Promise.allSettled([
        apiRequest<{ bookings: Booking[] }>("/api/v1/bookings/vendor"),
        apiRequest<{ subscription: SubscriptionInfo }>("/api/v1/subscription/mine"),
      ]);

      if (bookingsRes.status === "fulfilled") {
        setBookings(bookingsRes.value.bookings || []);
      }

      if (subRes.status === "fulfilled") {
        setSubscription(subRes.value.subscription || null);
      }
    } catch (error) {
      toast.error("Unable to load booking requests.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => void fetchBookings(), 0);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const handleBookingStatus = async (
    bookingId: string,
    status: "accepted" | "rejected",
  ) => {
    setUpdatingId(bookingId);

    try {
      await apiRequest(`/api/v1/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      toast.success(
        status === "accepted" ? "Booking accepted!" : "Booking declined.",
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId ? { ...booking, status } : booking,
        ),
      );
    } catch (error) {
      toast.error("Failed to update booking status", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const isPremium =
    subscription?.isPremium !== undefined
      ? subscription.isPremium === true
      : ["premium_monthly", "premium_yearly"].includes(subscription?.plan || "") &&
        subscription?.status === "active";

  const allFilteredBookings = [...bookings]
    .filter((booking) => filter === "all" || booking.status === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

  // In Free plan: limit to 3 events. In Paid plan: show all events.
  const visibleBookings = isPremium
    ? allFilteredBookings
    : allFilteredBookings.slice(0, 3);

  const hiddenCount = Math.max(0, allFilteredBookings.length - visibleBookings.length);

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-[1.5px] text-primary">
                Vendor Workspace
              </p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                isPremium ? "bg-gold/15 text-foreground" : "bg-primary/10 text-primary"
              }`}>
                {isPremium ? "Premium Active" : "Free Plan (3 Events Max)"}
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">
              Booking Requests
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review and respond to wedding booking requests from couples.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchBookings()}
            disabled={isLoading}
            className="w-fit gap-2 border-[#e9e1d8] bg-white"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Free Plan Upgrade Banner */}
        {!isPremium && !isLoading && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#eadbb5] bg-gradient-to-r from-[#fffdf7] via-white to-[#faf8f1] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                <Crown className="size-5 text-gold" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">
                  Free Plan: Displaying {visibleBookings.length} of {allFilteredBookings.length} Events
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subscription?.expired
                    ? "Your Premium plan has expired, so only 3 recent events are visible. Renew to unlock all events."
                    : "Free plan shows up to 3 booking events. Upgrade to Premium with Stripe to unlock all unlimited events and client requests."}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              render={<Link href="/vendor/subscription" />}
              className="w-fit shrink-0 gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Upgrade to Premium
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((item) => {
            const active = filter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={active}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-[#e9e1d8] bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Bookings list */}
        <div className="overflow-hidden rounded-xl border border-[#e9e1d8] bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <CalendarCheck className="size-7 text-primary" />
              </div>

              <h3 className="mt-4 font-heading text-lg font-semibold">
                {filter === "all"
                  ? "No Booking Requests Yet"
                  : `No ${filter} bookings`}
              </h3>

              <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                {filter === "all"
                  ? "Once couples discover your wedding services and send booking requests, they will appear here."
                  : "Booking requests with this status will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#eee8e0]">
              {visibleBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-[#faf9f6] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">
                          {booking.serviceName || "Wedding Service"}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyle(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Client: {booking.customerName || "Couple"}
                        {booking.customerEmail
                          ? ` (${booking.customerEmail})`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {booking.eventDate
                          ? `Event: ${new Date(
                              booking.eventDate,
                            ).toLocaleDateString()}`
                          : "Date to be confirmed"}
                        {" · "}
                        Requested{" "}
                        {booking.createdAt
                          ? new Date(booking.createdAt).toLocaleDateString()
                          : "—"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {booking.guestCount ? (
                          <span>Guests: {booking.guestCount}</span>
                        ) : null}
                        {booking.serviceCategory ? (
                          <span>Category: {booking.serviceCategory}</span>
                        ) : null}
                      </div>

                      {booking.notes && (
                        <p className="mt-2 rounded-lg bg-[#faf9f6] px-3 py-2 text-xs italic leading-5 text-[#555E53]">
                          &ldquo;{booking.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    {typeof booking.price === "number" && (
                      <p className="text-sm font-semibold">
                        ৳{booking.price.toLocaleString("en-BD")}
                      </p>
                    )}

                    {booking.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingId === booking._id}
                          onClick={() =>
                            void handleBookingStatus(booking._id, "rejected")
                          }
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="size-3.5" />
                          Decline
                        </Button>

                        <Button
                          size="sm"
                          disabled={updatingId === booking._id}
                          onClick={() =>
                            void handleBookingStatus(booking._id, "accepted")
                          }
                          className="gap-1"
                        >
                          {updatingId === booking._id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden Bookings Notice for Free Plan */}
        {!isPremium && hiddenCount > 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#eadbb5] bg-[#fffdf7] p-6 text-center">
            <Crown className="size-7 text-gold" />
            <div>
              <h4 className="text-sm font-semibold">
                +{hiddenCount} More Booking {hiddenCount === 1 ? "Event" : "Events"} Hidden
              </h4>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                You have received {allFilteredBookings.length} total booking requests. The Free Plan allows viewing up to 3 events. Upgrade to Premium via Stripe to manage all requests.
              </p>
            </div>
            <Button
              size="sm"
              render={<Link href="/vendor/subscription" />}
              className="mt-1 gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Upgrade to Unlock All Events
            </Button>
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-3 rounded-xl border border-[#eadbb5] bg-[#fffdf7] p-4">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-gold" />

          <p className="text-xs leading-5 text-muted-foreground">
            Responding quickly to pending requests improves your chances of
            confirmed bookings and better placement in couple searches.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
