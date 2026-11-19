"use client";

import * as React from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  PlusCircle,
  RefreshCw,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

type Booking = {
  _id: string;
  serviceId: string;
  serviceName?: string;
  customerName?: string;
  customerEmail?: string;
  eventDate?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  price?: number;
  createdAt?: string;
};

type ServiceItem = {
  _id: string;
  name: string;
  category: string;
  price: number;
  availability: boolean;
};

type VendorProfile = {
  name?: string;
  businessName?: string;
  studioName?: string;
  vendorApproved?: boolean;
  plan?: string;
  subscriptionPlan?: string;
  subscription?: {
    plan?: string;
    name?: string;
  };
};

type Subscription = {
  plan: string;
  planName: string;
  activeServices: number;
  activeServiceLimit: number | null;
  remainingServices: number | null;
  status?: string;
  isPremium?: boolean;
  expired?: boolean;
};

export default function VendorDashboardPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [subscription, setSubscription] = React.useState<Subscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const vendor = user as VendorProfile | null;

  // Vendor information
  const vendorName =
    vendor?.businessName || vendor?.studioName || vendor?.name || "Your Studio";

  const isApproved = vendor?.vendorApproved === true;

  // Subscription information (fresh from the server, session as fallback)
  const planName =
    subscription?.planName ||
    subscription?.plan ||
    vendor?.subscription?.plan ||
    vendor?.subscription?.name ||
    vendor?.subscriptionPlan ||
    vendor?.plan ||
    "Free Plan";

  const normalizedPlan = planName.toLowerCase();
  const isPremium =
    subscription?.isPremium !== undefined
      ? subscription.isPremium === true
      : normalizedPlan.includes("premium") &&
        subscription?.status !== "cancelled";

  const planLimit = subscription?.activeServiceLimit ?? (isPremium ? Infinity : 3);

  // Fetch vendor data
  const fetchVendorData = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const [bookingsRes, servicesRes, subscriptionRes] =
        await Promise.allSettled([
          apiRequest<{ bookings: Booking[] }>("/api/v1/bookings/vendor"),
          apiRequest<{ services: ServiceItem[] }>("/api/v1/services/mine"),
          apiRequest<{ subscription: Subscription }>(
            "/api/v1/subscription/mine",
          ),
        ]);

      if (bookingsRes.status === "fulfilled" && bookingsRes.value.bookings) {
        setBookings(bookingsRes.value.bookings);
      }

      if (servicesRes.status === "fulfilled" && servicesRes.value.services) {
        setServices(servicesRes.value.services);
      }

      if (subscriptionRes.status === "fulfilled") {
        setSubscription(subscriptionRes.value.subscription);
      }
    } catch (error) {
      console.error("Vendor dashboard error:", error);
      toast.error("Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchVendorData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchVendorData]);

  // Booking status update
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

  // Dynamic statistics
  const totalServices = services.length;

  const activeServices =
    subscription?.activeServices ??
    (isApproved
      ? services.filter((service) => service.availability).length
      : 0);

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;

  const acceptedBookings = bookings.filter(
    (booking) => booking.status === "accepted",
  ).length;

  const statistics = [
    {
      label: "Total Services",
      value: totalServices,
      description: "Listed wedding services",
      icon: BriefcaseBusiness,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Approved & Active",
      value: activeServices,
      description: "Available services",
      icon: CheckCircle2,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Pending Requests",
      value: pendingBookings,
      description: "Waiting for your response",
      icon: Clock3,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Accepted Bookings",
      value: acceptedBookings,
      description: "Confirmed reservations",
      icon: CalendarCheck,
      iconClass: "bg-sky-100 text-sky-700",
    },
  ];

  const recentBookingLimit = isPremium ? 5 : 3;
  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, recentBookingLimit);
  const hiddenBookingsCount = Math.max(0, bookings.length - recentBookingLimit);

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="flex flex-col gap-6">
        {/* Dashboard Heading */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[1.5px] text-primary">
                Vendor Workspace
              </span>

              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <Clock3 className="size-3" />
                )}
                {isApproved ? "Approved Partner" : "Pending Approval"}
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">
              Vendor Dashboard Overview
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Monitor your published wedding services, incoming couple requests,
              and subscription status for {vendorName}.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchVendorData()}
            disabled={isLoading}
            className="w-fit gap-2 border-[#e9e1d8] bg-white"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Approval Alert */}
        {!isApproved && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-600" />

            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Application Under Admin Review
              </h3>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Your vendor account is currently being reviewed by our
                administration team. Once approved, your services can become
                visible to couples.
              </p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-[#e9e1d8] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>

                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>

                <p className="mt-3 font-heading text-3xl font-bold">
                  {isLoading ? (
                    <span className="inline-block h-8 w-10 animate-pulse rounded bg-muted" />
                  ) : (
                    stat.value
                  )}
                </p>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Subscription Card */}
        <section className="overflow-hidden rounded-xl border border-[#eadbb5] bg-gradient-to-r from-[#fffdf7] via-white to-[#faf8f1] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Crown className="size-5 text-gold" />

                <h2 className="font-heading text-xl font-bold">
                  Current Subscription Plan
                </h2>

                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                  {planName}
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isPremium
                  ? "You are enjoying your Premium vendor plan. Manage your services and receive wedding booking requests."
                  : "Free Plan allows up to 3 active wedding services. Upgrade to Premium for more service listings and additional benefits."}
              </p>

              {!isPremium && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Service usage</span>
                    <span className="font-semibold text-foreground">
                      {activeServices} / {planLimit}
                    </span>
                  </div>

                  <div className="h-2 max-w-sm overflow-hidden rounded-full bg-[#eee8dc]">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          (activeServices / Math.max(planLimit, 1)) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
              <Button
                variant="outline"
                render={<Link href="/vendor/services/new" />}
                className="gap-2 border-[#e9e1d8] bg-white"
                disabled={!isPremium && activeServices >= planLimit}
              >
                <PlusCircle className="size-4" />
                Add Service
              </Button>

              {!isPremium && (
                <Button
                  render={<Link href="/vendor/subscription" />}
                  className="gap-2"
                >
                  <Crown className="size-4" />
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>

          {/* Free plan hidden count notice */}
          {!isPremium && !isLoading && hiddenBookingsCount > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#eadbb5] bg-[#fffdf7] px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {hiddenBookingsCount} more booking{hiddenBookingsCount !== 1 ? "s" : ""}
                </span>{" "}
                hidden on the Free Plan. Upgrade to Premium to view all.
              </p>
              <Link
                href="/vendor/subscription"
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Upgrade →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Bookings */}
        <section className="mt-2">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold">Recent Bookings</h2>
                {!isPremium && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                    Free Plan (3 Max)
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage incoming booking requests from couples.
              </p>
            </div>

            <Link
              href="/vendor/bookings"
              className="flex w-fit items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View All Bookings
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e9e1d8] bg-white shadow-sm">
            {isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="flex min-h-[230px] flex-col items-center justify-center px-5 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <CalendarCheck className="size-7 text-primary" />
                </div>

                <h3 className="mt-4 font-heading text-lg font-semibold">
                  No Booking Requests Yet
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                  Once couples discover your wedding services and send booking
                  requests, they will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eee8e0]">
                {recentBookings.map((booking) => (
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
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              booking.status === "accepted"
                                ? "bg-emerald-100 text-emerald-700"
                                : booking.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : booking.status === "cancelled"
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Client: {booking.customerName || "Couple"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {booking.eventDate
                            ? `Event: ${new Date(
                                booking.eventDate,
                              ).toLocaleDateString()}`
                            : "Date to be confirmed"}
                        </p>
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

          {/* Free plan hidden count notice */}
          {!isPremium && !isLoading && hiddenBookingsCount > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#eadbb5] bg-[#fffdf7] px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {hiddenBookingsCount} more booking{hiddenBookingsCount !== 1 ? "s" : ""}
                </span>{" "}
                hidden on the Free Plan. Upgrade to Premium to view all.
              </p>
              <Link
                href="/vendor/subscription"
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Upgrade →
              </Link>
            </div>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
