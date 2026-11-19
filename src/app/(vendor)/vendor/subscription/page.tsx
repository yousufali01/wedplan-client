"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  BriefcaseBusiness,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type PlanId = "free" | "premium_monthly" | "premium_yearly";

type Subscription = {
  plan: PlanId;
  status: string;
  planName: string;
  price: number;
  interval: string;
  activeServiceLimit: number | null;
  activeServices: number;
  remainingServices: number | null;
  expiresAt?: string;
  paymentStatus?: string;
  isPremium?: boolean;
  expired?: boolean;
};

const plans = [
  {
    id: "free" as PlanId,
    name: "Free Plan",
    description: "Ideal for boutique vendors getting started on WedPlan.",
    price: 0,
    interval: "month",
    badge: "Current Plan",
    priceNote: "Free forever · No credit card required",
    features: [
      "Maximum 3 Active Services",
      "Access to 3 Recent Booking Events",
      "Basic Vendor Dashboard",
      "Standard Customer Inquiries",
    ],
  },
  {
    id: "premium_monthly" as PlanId,
    name: "Premium Monthly",
    description: "Built for established wedding studios scaling bookings.",
    price: 29,
    interval: "month",
    badge: "Recommended",
    priceNote: "Billed monthly · Cancel anytime",
    features: [
      "Unlimited Active Services",
      "Unlimited Booking Requests & Events Access",
      "Premium Vendor Badge",
      "Featured Service Placement",
      "Priority Customer Inquiries",
      "All Free Plan Features",
    ],
  },
  {
    id: "premium_yearly" as PlanId,
    name: "Premium Yearly",
    description: "Best for growing wedding businesses planning long-term.",
    price: 290,
    interval: "year",
    badge: "Best Value",
    priceNote: "Billed once a year · Save $58 vs monthly",
    features: [
      "Unlimited Active Services",
      "Unlimited Booking Requests & Events Access",
      "Premium Vendor Badge",
      "Featured Service Placement",
      "Priority Customer Inquiries",
      "All Free Plan Features",
    ],
  },
];

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const [downgrading, setDowngrading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const sessionId = searchParams.get("session_id");
  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";
  const planParam = searchParams.get("plan");

  const fetchSubscription = useCallback(async () => {
    try {
      const data = await apiRequest<{ subscription: Subscription }>(
        "/api/v1/subscription/mine",
      );
      setSubscription(data.subscription);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load subscription.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void fetchSubscription(), 0);
    return () => clearTimeout(timer);
  }, [fetchSubscription]);

  const clearCheckoutParams = useCallback(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  // Handle Stripe Checkout redirects (success, failure or cancelled).
  useEffect(() => {
    if (isSuccess && sessionId) {
      let active = true;

      const verifyPayment = async () => {
        setIsVerifying(true);
        try {
          const res = await apiRequest<{
            success: boolean;
            message: string;
            subscription: Subscription;
          }>("/api/v1/subscription/verify-stripe-session", {
            method: "POST",
            body: JSON.stringify({
              sessionId,
              plan: planParam || "premium_monthly",
            }),
          });

          if (active) {
            toast.success(
              res.message ||
                "Payment verified! Your account has been upgraded to Premium.",
            );
            if (res.subscription) setSubscription(res.subscription);
            clearCheckoutParams();
            await fetchSubscription();
          }
        } catch (err) {
          if (active) {
            toast.error(
              err instanceof Error
                ? err.message
                : "Unable to verify payment with Stripe.",
            );
            // Never leave the success params in the URL — that would retry
            // verification forever. The account stays on Free.
            clearCheckoutParams();
          }
        } finally {
          if (active) setIsVerifying(false);
        }
      };

      void verifyPayment();

      return () => {
        active = false;
      };
    }

    if (isSuccess && !sessionId) {
      toast.error(
        "Payment verification link is incomplete. No plan was changed.",
      );
      clearCheckoutParams();
    } else if (isCanceled) {
      toast.info("Payment was cancelled. You remain on the Free plan.");
      clearCheckoutParams();
    }
  }, [
    isSuccess,
    sessionId,
    planParam,
    isCanceled,
    clearCheckoutParams,
    fetchSubscription,
  ]);

  /**
   * Primary path: the in-app checkout page (src/app/payment) where the card
   * is entered on our own branded screen and charged through Stripe.
   */
  const handleUpgrade = async (planId: PlanId) => {
    if (planId === "free" || upgrading) return;
    router.push(`/payment?plan=${planId}`);
  };

  /** Fallback path: Stripe's own hosted Checkout page. */
  const handleStripeCheckout = async (planId: PlanId) => {
    if (planId === "free" || upgrading) return;

    try {
      setUpgrading(planId);

      // The backend derives vendorId/email from the authenticated session —
      // nothing about the buyer is trusted from the browser.
      const data = await apiRequest<{
        success: boolean;
        url: string;
        sessionId?: string;
      }>("/api/v1/subscription/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan: planId }),
      });

      if (!data.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      toast.loading("Redirecting to secure Stripe Checkout...");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to initiate payment.",
      );
      setUpgrading(null);
    }
  };

  const handleDowngrade = async () => {
    if (
      !window.confirm(
        "Switch back to the Free plan? Only 3 active services and 3 booking events will be allowed.",
      )
    ) {
      return;
    }

    setDowngrading(true);

    try {
      await apiRequest("/api/v1/subscription/downgrade", { method: "POST" });
      toast.success("Switched to the Free plan.");
      await fetchSubscription();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to switch plans.",
      );
    } finally {
      setDowngrading(false);
    }
  };

  if (loading || isVerifying) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isVerifying ? "Verifying your Stripe payment..." : "Loading subscription details..."}
        </p>
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  // Backend normalises expired/inactive premium to Free; fall back to the
  // local check only for an older server response.
  const isPremiumActive =
    subscription?.isPremium !== undefined
      ? subscription.isPremium === true
      : ["premium_monthly", "premium_yearly"].includes(currentPlan) &&
        subscription?.status === "active";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[1.5px] text-primary">
              Vendor Membership
            </span>

            <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-semibold text-foreground">
              <Crown className="size-3 text-gold" />
              {isPremiumActive ? "Premium Active" : "Secure Card Payment Ready"}
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">
            Subscription Plans
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose the plan that fits your wedding business. Upgrade to Premium for
            unlimited services, all booking events access, and featured placement.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchSubscription()}
          className="w-fit gap-2 border-[#e9e1d8] bg-white"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Active Plan Status */}
      <section className="relative overflow-hidden rounded-xl border border-[#eadbb5] bg-gradient-to-r from-[#fffdf7] via-white to-[#faf8f1] p-5 shadow-sm sm:p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Active Plan Status
            </p>

            <h2 className="mt-2 flex items-center gap-2 font-heading text-2xl font-bold">
              <Crown className={`size-5 ${isPremiumActive ? "text-gold" : "text-muted-foreground"}`} />
              {subscription?.planName || "Free"} Plan
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPremiumActive ? "bg-emerald-100 text-emerald-800" : "bg-primary/10 text-primary"
              }`}>
                {isPremiumActive ? "Active Premium Member" : "Free Tier"}
              </span>

              {subscription?.expiresAt && (
                <span className="text-xs text-muted-foreground">
                  Valid until:{" "}
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">Active Services</p>

            <p className="mt-1 text-3xl font-bold tabular-nums">
              <span className="text-primary">
                {subscription?.activeServices ?? 0}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {subscription?.activeServiceLimit ?? "Unlimited"}
              </span>
            </p>

            {subscription?.remainingServices !== null &&
              subscription?.remainingServices !== undefined && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {subscription.remainingServices} service slots remaining
                </p>
              )}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section>
        <div className="mb-8">
          <h2 className="font-heading text-xl font-bold">Choose Your Plan</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pay securely with your credit/debit card on WedPlan&apos;s own
            checkout page and unlock every feature instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPremiumPlan = plan.id !== "free";
            const isRecommended = plan.id === "premium_monthly";
            const isDark = isRecommended;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl p-6 transition-all duration-300 sm:p-7",
                  isDark
                    ? "border border-gold/40 bg-[linear-gradient(165deg,#16402f_0%,#0f2e23_55%,#0a231b_100%)] pt-9 text-white shadow-[0_18px_45px_-20px_rgba(10,35,27,0.65)] hover:-translate-y-1.5 hover:shadow-[0_28px_55px_-20px_rgba(201,162,74,0.45)]"
                    : isCurrent
                      ? "border border-primary/40 bg-white ring-1 ring-primary/20 shadow-sm hover:-translate-y-1 hover:shadow-md"
                      : "border border-[#e9e1d8] bg-white shadow-sm hover:-translate-y-1 hover:shadow-md",
                )}
              >
                {/* Top sheen on premium cards */}
                {isPremiumPlan && (
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                      isDark
                        ? "via-gold/70"
                        : "via-[#d9b45c]/70",
                    )}
                  />
                )}

                {/* Ribbon */}
                {isRecommended && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#f4e0a8] via-[#e3c076] to-[#c9a04a] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#123528] shadow-[0_6px_16px_rgba(201,162,74,0.45)]">
                    Most Popular
                  </span>
                )}

                {/* Header */}
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      isDark
                        ? "bg-gold/15 text-gold ring-1 ring-gold/30"
                        : isPremiumPlan
                          ? "bg-gold/10 text-gold ring-1 ring-gold/25"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    {isPremiumPlan ? (
                      <Crown className="size-5" />
                    ) : (
                      <BriefcaseBusiness className="size-5" />
                    )}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-xl font-bold">
                      {plan.name}
                    </h3>

                    {plan.id === "premium_yearly" && (
                      <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>

                <p
                  className={cn(
                    "mt-4 min-h-10 text-sm leading-6",
                    isDark ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div
                  className={cn(
                    "my-6 border-t pt-6",
                    isDark ? "border-white/10" : "border-[#e9e1d8]",
                  )}
                >
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "font-heading text-[42px] font-bold leading-none tracking-tight",
                        isDark &&
                          "bg-gradient-to-r from-[#f7e7b8] via-[#e6c67e] to-[#c9a04a] bg-clip-text text-transparent",
                      )}
                    >
                      ${plan.price}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isDark ? "text-white/50" : "text-muted-foreground",
                      )}
                    >
                      / {plan.interval}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-2 text-[11px] font-medium",
                      isDark ? "text-white/45" : "text-muted-foreground",
                    )}
                  >
                    {plan.priceNote}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.14em]",
                      isDark ? "text-white/40" : "text-muted-foreground",
                    )}
                  >
                    What&apos;s included
                  </p>

                  <ul className="mt-4 space-y-3.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                            isDark
                              ? "bg-gold/20 text-gold"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>

                        <span
                          className={cn(
                            "text-sm leading-6",
                            isDark ? "text-white/75" : "text-muted-foreground",
                          )}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <div className="mt-8 space-y-2.5">
                  {isCurrent ? (
                    <>
                      <button
                        disabled
                        className={cn(
                          "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold",
                          isDark
                            ? "border-white/25 bg-white/10 text-white"
                            : "border-primary/30 bg-primary/10 text-primary",
                        )}
                      >
                        <ShieldCheck className="size-4" />
                        Current Plan
                      </button>

                      {isPremiumPlan && (
                        <button
                          onClick={() => void handleDowngrade()}
                          disabled={downgrading}
                          className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            isDark
                              ? "border-white/15 bg-white/5 text-white/70 hover:border-gold/50 hover:text-gold"
                              : "border-[#e9e1d8] bg-white text-muted-foreground hover:border-primary/40 hover:text-primary",
                          )}
                        >
                          {downgrading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          Switch to Free Plan
                        </button>
                      )}
                    </>
                  ) : isPremiumPlan ? (
                    <>
                      <button
                        onClick={() => void handleUpgrade(plan.id)}
                        disabled={upgrading !== null}
                        className={cn(
                          "group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
                          isDark
                            ? "bg-gradient-to-r from-[#f2dca6] to-[#d3a955] text-[#123528] shadow-[0_8px_22px_-8px_rgba(211,169,85,0.65)] hover:from-[#f7e6bd] hover:to-[#dcb463]"
                            : "bg-primary text-primary-foreground shadow-[0_8px_22px_-10px_rgba(17,87,64,0.8)] hover:bg-primary/90",
                        )}
                      >
                        <CreditCard className="size-4" />
                        Pay ${plan.price}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      <button
                        onClick={() => void handleStripeCheckout(plan.id)}
                        disabled={upgrading !== null}
                        className={cn(
                          "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          isDark
                            ? "border-white/20 bg-white/5 text-white/75 hover:border-gold/50 hover:text-gold"
                            : "border-[#e9e1d8] bg-white text-muted-foreground hover:border-primary/40 hover:text-primary",
                        )}
                      >
                        {upgrading === plan.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Connecting to Stripe...
                          </>
                        ) : (
                          <>
                            <Lock className="size-3.5" />
                            Use Stripe Checkout instead
                          </>
                        )}
                      </button>

                      <p
                        className={cn(
                          "pt-1 text-center text-[10px]",
                          isDark ? "text-white/40" : "text-muted-foreground",
                        )}
                      >
                        Secured by Stripe · 256-bit SSL encryption
                      </p>
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-[#e9e1d8] bg-[#faf9f6] px-4 py-3.5 text-sm font-semibold text-muted-foreground"
                    >
                      Free Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Note */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#eadbb5] bg-gradient-to-r from-[#fffdf7] via-white to-[#faf8f1] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/25">
            <Star className="size-4" />
          </span>

          <div>
            <p className="text-sm font-semibold">
              Secure payments, powered by Stripe
            </p>
            <p className="mt-0.5 max-w-xl text-xs leading-5 text-muted-foreground">
              Your card details never touch our servers. All major credit and debit
              cards are accepted. Free plan permits up to 3 services and 3 booking
              events; Premium grants unlimited access.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {["Visa", "Mastercard", "Amex", "Discover"].map((brand) => (
            <span
              key={brand}
              className="rounded-md border border-[#e9e1d8] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VendorSubscriptionPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <SubscriptionContent />
      </Suspense>
    </ProtectedRoute>
  );
}
