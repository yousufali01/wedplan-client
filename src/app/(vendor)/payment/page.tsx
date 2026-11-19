"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadStripe,
  type Stripe,
  type StripeCardCvcElement,
  type StripeCardExpiryElement,
  type StripeCardNumberElement,
  type StripeElements,
} from "@stripe/stripe-js";
import {
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ───────────────────────── Config ───────────────────────── */

const ACCENT = "#5B6CE1";
const ACCENT_HOVER = "#4c5cd0";

const PLANS = {
  premium_monthly: {
    id: "premium_monthly",
    name: "Premium Monthly",
    price: 29,
    interval: "month",
  },
  premium_yearly: {
    id: "premium_yearly",
    name: "Premium Yearly",
    price: 290,
    interval: "year",
  },
} as const;

type PlanId = keyof typeof PLANS;

type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  expMonth?: number | null;
  expYear?: number | null;
};

type Subscription = {
  plan: string;
  planName?: string;
  expiresAt?: string;
  isPremium?: boolean;
};

const COUNTRIES = [
  { code: "BD", label: "Bangladesh" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "SG", label: "Singapore" },
  { code: "AE", label: "United Arab Emirates" },
];

const money = (amount: number) => `$${amount.toFixed(2)}`;

/* ───────────────────────── Brand badges ───────────────────────── */

function BrandBadge({ brand }: { brand: string }) {
  const normalized = (brand || "card").toLowerCase();

  if (normalized === "visa") {
    return (
      <span className="inline-flex h-6 w-9 items-center justify-center rounded border border-black/10 bg-white text-[9px] font-black italic tracking-tight text-[#1A1F71]">
        VISA
      </span>
    );
  }

  if (normalized === "mastercard") {
    return (
      <span className="relative inline-flex h-6 w-9 items-center justify-center rounded border border-black/10 bg-white">
        <span className="absolute left-1.5 size-3.5 rounded-full bg-[#EB001B]" />
        <span className="absolute right-1.5 size-3.5 rounded-full bg-[#F79E1B] opacity-90 mix-blend-multiply" />
      </span>
    );
  }

  if (normalized === "americanexpress" || normalized === "amex") {
    return (
      <span className="inline-flex h-6 w-9 items-center justify-center rounded border border-black/10 bg-[#2E77BC] text-[8px] font-bold text-white">
        AMEX
      </span>
    );
  }

  if (normalized === "discover") {
    return (
      <span className="inline-flex h-6 w-9 items-center justify-center rounded border border-black/10 bg-white text-[8px] font-bold text-[#F76B1C]">
        DISC
      </span>
    );
  }

  if (normalized === "jcb") {
    return (
      <span className="inline-flex h-6 w-9 items-center justify-center rounded border border-black/10 bg-[#0B4EA2] text-[8px] font-bold text-white">
        JCB
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-9 items-center justify-center rounded border border-black/10 bg-white text-black/70">
      <CreditCard className="size-3.5" />
    </span>
  );
}

/** Small logo-style chips for the wallets shown in the payment list. */
function WalletMark({ kind }: { kind: "apple" | "link" | "klarna" | "cashapp" }) {
  if (kind === "apple") {
    return (
      <span className="inline-flex h-6 w-9 items-center justify-center rounded bg-black text-[11px] font-semibold text-white">
        Pay
      </span>
    );
  }

  if (kind === "link") {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#00D66F] text-[11px] font-black text-white">
        L
      </span>
    );
  }

  if (kind === "klarna") {
    return (
      <span className="inline-flex h-6 w-9 items-center justify-center rounded bg-[#FFB3C7] text-[11px] font-black text-black">
        K
      </span>
    );
  }

  return (
    <span className="inline-flex size-6 items-center justify-center rounded bg-[#00D64A] text-[12px] font-black text-white">
      $
    </span>
  );
}

/* ───────────────────────── Radio row ───────────────────────── */

function MethodRow({
  selected,
  onSelect,
  disabled,
  mark,
  title,
  subtitle,
  trailing,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  mark: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  trailing?: React.ReactNode;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
        disabled ? "cursor-not-allowed opacity-55" : "hover:bg-[#FAFAFB]",
      )}
    >
      <span
        className="grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{
          borderColor: selected ? ACCENT : "#C9CCD4",
          background: selected ? ACCENT : "transparent",
        }}
      >
        {selected && <span className="size-[6px] rounded-full bg-white" />}
      </span>

      <span className="shrink-0">{mark}</span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-medium text-[#111827]">
            {title}
          </span>
          {badge && (
            <span className="rounded-full bg-[#F1F2F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
              {badge}
            </span>
          )}
        </span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[12px] text-[#8A8F98]">
            {subtitle}
          </span>
        )}
      </span>

      {trailing}
    </button>
  );
}

/* ───────────────────────── Add-card modal ───────────────────────── */

type CardEls = {
  number: StripeCardNumberElement;
  expiry: StripeCardExpiryElement;
  cvc: StripeCardCvcElement;
};

type NewCard = SavedCard;

function AddCardModal({
  open,
  onClose,
  stripe,
  elements,
  cardEls,
  onReady,
  onCreated,
  pendingSave,
  setPendingSave,
}: {
  open: boolean;
  onClose: () => void;
  stripe: Stripe | null;
  elements: StripeElements | null;
  cardEls: CardEls | null;
  onReady: (els: CardEls) => void;
  onCreated: (card: NewCard) => void;
  pendingSave: boolean;
  setPendingSave: (value: boolean) => void;
}) {
  const numberRef = React.useRef<HTMLDivElement>(null);
  const expiryRef = React.useRef<HTMLDivElement>(null);
  const cvcRef = React.useRef<HTMLDivElement>(null);

  const [errors, setErrors] = React.useState<{
    number?: string;
    expiry?: string;
    cvc?: string;
  }>({});
  const [country, setCountry] = React.useState("BD");
  const [zip, setZip] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const elementStyle = {
    base: {
      color: "#111827",
      fontSize: "15px",
      fontFamily: "inherit",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#9CA3AF" },
    },
    invalid: { color: "#DC2626", "::placeholder": { color: "#9CA3AF" } },
  };

  // Guards against React StrictMode's double-invoked effects creating a
  // second set of Stripe elements (which would never be destroyed).
  const creatingRef = React.useRef(false);

  // Create the Stripe elements once, as soon as the modal opens.
  React.useEffect(() => {
    if (!open || cardEls || creatingRef.current || !stripe || !elements) return;
    creatingRef.current = true;

    const number = elements.create("cardNumber", {
      style: elementStyle,
      placeholder: "Card number",
      showIcon: false,
      disableLink: true,
    });
    const expiry = elements.create("cardExpiry", {
      style: elementStyle,
      placeholder: "MM / YY",
    });
    const cvc = elements.create("cardCvc", {
      style: elementStyle,
      placeholder: "CVC",
    });

    number.on("change", (event) =>
      setErrors((prev) => ({ ...prev, number: event.error?.message })),
    );
    expiry.on("change", (event) =>
      setErrors((prev) => ({ ...prev, expiry: event.error?.message })),
    );
    cvc.on("change", (event) =>
      setErrors((prev) => ({ ...prev, cvc: event.error?.message })),
    );

    onReady({ number, expiry, cvc });
    // Only run when the modal first opens for this Stripe instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cardEls, stripe, elements]);

  // Mount / unmount with the dialog so the iframes sit inside it.
  React.useEffect(() => {
    if (!open || !cardEls) return;

    const frame = window.setTimeout(() => {
      if (numberRef.current) cardEls.number.mount(numberRef.current);
      if (expiryRef.current) cardEls.expiry.mount(expiryRef.current);
      if (cvcRef.current) cardEls.cvc.mount(cvcRef.current);
    }, 0);

    return () => {
      window.clearTimeout(frame);
      try {
        cardEls.number.unmount();
        cardEls.expiry.unmount();
        cardEls.cvc.unmount();
      } catch {
        /* already unmounted */
      }
    };
  }, [open, cardEls]);

  // Reset transient state when the dialog is re-opened (adjusting state
  // during render is the React-recommended alternative to an effect here).
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setErrors({});
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const handleContinue = async () => {
    if (!stripe || !cardEls) {
      toast.error("Payment form is still loading. Please try again.");
      return;
    }

    if (errors.number || errors.expiry || errors.cvc) {
      toast.error("Please fix the highlighted card fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardEls.number,
        billing_details: {
          address: {
            country: country || undefined,
            postal_code: zip.trim() || undefined,
          },
        },
      });

      if (error || !paymentMethod) {
        toast.error(error?.message || "We could not read those card details.");
        return;
      }

      const card = paymentMethod.card;

      onCreated({
        id: paymentMethod.id,
        brand: card?.brand || "card",
        last4: card?.last4 || "",
        expMonth: card?.exp_month || null,
        expYear: card?.exp_year || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add new card"
        className="max-h-[92vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-heading text-2xl font-bold text-[#111827]">
            Add new card
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-black/5"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Card information */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#6B7280]">Card information</p>
            <p className="text-[12px] text-[#6B7280]">
              Test card:{" "}
              <span className="font-medium text-[#111827]">
                4242 4242 4242 4242
              </span>
            </p>
          </div>

          <div
            className={cn(
              "mt-2 overflow-hidden rounded-xl border bg-white",
              errors.number ? "border-red-500" : "border-[#E3E5EA]",
            )}
          >
            <div className="relative flex items-center px-3.5">
              <div ref={numberRef} className="h-[26px] w-full" />
              <span className="ml-2 flex shrink-0 items-center gap-1.5">
                <span className="rounded border border-black/10 bg-white px-1 py-0.5 text-[8px] font-black italic text-[#1A1F71]">
                  VISA
                </span>
                <span className="relative flex h-[18px] w-[28px] items-center justify-center rounded border border-black/10 bg-white">
                  <span className="absolute left-1 size-2.5 rounded-full bg-[#EB001B]" />
                  <span className="absolute right-1 size-2.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
                </span>
                <span className="rounded border border-black/10 bg-[#2E77BC] px-1 py-0.5 text-[7px] font-bold text-white">
                  AMEX
                </span>
                <span className="rounded border border-black/10 bg-white px-1 py-0.5 text-[7px] font-bold text-[#0B4EA2]">
                  JCB
                </span>
              </span>
            </div>

            <div className="flex border-t border-[#E3E5EA]">
              <div
                className={cn(
                  "flex-1 border-r px-3.5",
                  errors.expiry ? "border-red-500" : "border-[#E3E5EA]",
                )}
              >
                <div ref={expiryRef} className="h-[26px]" />
              </div>
              <div
                className={cn(
                  "flex-1 px-3.5",
                  errors.cvc ? "border-red-500" : "",
                )}
              >
                <div ref={cvcRef} className="h-[26px]" />
              </div>
            </div>
          </div>

          {(errors.number || errors.expiry || errors.cvc) && (
            <p className="mt-1.5 text-[12px] text-red-600">
              {errors.number || errors.expiry || errors.cvc}
            </p>
          )}
        </div>

        {/* Billing address */}
        <div className="mt-5">
          <p className="text-[13px] text-[#6B7280]">Billing address</p>

          <div className="mt-2 overflow-hidden rounded-xl border border-[#E3E5EA] bg-white">
            <label className="relative block border-b border-[#E3E5EA] px-3.5 py-2">
              <span className="absolute left-3.5 top-1.5 text-[10px] text-[#8A8F98]">
                Country or region
              </span>
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full appearance-none bg-transparent pt-3 text-[15px] text-[#111827] outline-none"
              >
                {COUNTRIES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-[#8A8F98]" />
            </label>

            <input
              value={zip}
              onChange={(event) => setZip(event.target.value)}
              inputMode="numeric"
              placeholder="ZIP"
              aria-label="ZIP"
              className="w-full bg-transparent px-3.5 py-3 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Save card */}
        <button
          type="button"
          onClick={() => setPendingSave(!pendingSave)}
          className="mt-5 flex w-full items-center gap-3 text-left"
        >
          <span
            className="grid size-5 shrink-0 place-items-center rounded border transition-colors"
            style={{
              background: pendingSave ? ACCENT : "white",
              borderColor: pendingSave ? ACCENT : "#C9CCD4",
            }}
          >
            {pendingSave && <Check className="size-3.5 text-white" strokeWidth={3} />}
          </span>
          <span className="text-[14px] text-[#374151]">
            Save this card for future WedPlan payments
          </span>
        </button>

        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={submitting}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-colors disabled:opacity-70"
          style={{ background: submitting ? "#9AA4F0" : ACCENT }}
          onMouseEnter={(event) => {
            if (!submitting) event.currentTarget.style.background = ACCENT_HOVER;
          }}
          onMouseLeave={(event) => {
            if (!submitting) event.currentTarget.style.background = ACCENT;
          }}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Continue
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#8A8F98]">
          <Lock className="size-3" />
          Card details are encrypted and sent directly to Stripe.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedPlan = searchParams.get("plan") || searchParams.get("planId");
  const plan: PlanId =
    requestedPlan === "premium_yearly" ? "premium_yearly" : "premium_monthly";
  const planInfo = PLANS[plan];

  const [loading, setLoading] = React.useState(true);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [savedCards, setSavedCards] = React.useState<SavedCard[]>([]);

  const [stripe, setStripe] = React.useState<Stripe | null>(null);
  const [elements, setElements] = React.useState<StripeElements | null>(null);
  const [cardEls, setCardEls] = React.useState<CardEls | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [pendingSave, setPendingSave] = React.useState(true);

  const [selected, setSelected] = React.useState<string>("new");
  const [newCard, setNewCard] = React.useState<NewCard | null>(null);
  const [showSavedDetail, setShowSavedDetail] = React.useState(false);

  const [paying, setPaying] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const stripeKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_KEY ||
    "";

  /* Load subscription + saved cards */
  React.useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const data = await apiRequest<{
          subscription: Subscription;
          paymentMethods?: SavedCard[];
        }>("/api/v1/subscription/mine");

        if (cancelled) return;
        setSubscription(data.subscription);
        const cards = data.paymentMethods || [];
        setSavedCards(cards);
        if (cards.length > 0) setSelected(cards[0].id);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load your subscription details.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  /* Load Stripe.js lazily (as soon as the page mounts) */
  React.useEffect(() => {
    let cancelled = false;

    if (!stripeKey) return;

    void loadStripe(stripeKey).then((instance) => {
      if (cancelled || !instance) return;
      setStripe(instance);
      setElements(instance.elements());
    });

    return () => {
      cancelled = true;
    };
  }, [stripeKey]);

  const selectedCard = React.useMemo(() => {
    if (selected === "new") return newCard;
    return savedCards.find((card) => card.id === selected) || null;
  }, [selected, newCard, savedCards]);

  const readyToPay = Boolean(selectedCard);

  const handlePay = async () => {
    if (!readyToPay) {
      setModalOpen(true);
      return;
    }

    const isSaved = savedCards.some((card) => card.id === selected);

    setPaying(true);
    try {
      const data = await apiRequest<{
        success: boolean;
        message: string;
        subscription: Subscription;
      }>("/api/v1/subscription/pay", {
        method: "POST",
        body: JSON.stringify({
          paymentMethodId: selected,
          planId: plan,
          useSavedCard: isSaved,
          saveCard: !isSaved && pendingSave,
        }),
      });

      setSubscription(data.subscription);
      setDone(true);
      toast.success(data.message || "Payment successful!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Payment failed. Please try again.",
      );
    } finally {
      setPaying(false);
    }
  };

  /* ─────────────── Success screen ─────────────── */
  if (done) {
    return (
      <div className="mx-auto w-full max-w-[440px]">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.08)]">
          <div className="flex flex-col items-center px-7 py-12 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-emerald-100">
              <Check className="size-8 text-emerald-600" strokeWidth={3} />
            </span>

            <h1 className="mt-5 font-heading text-2xl font-bold text-[#111827]">
              Payment successful
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Your {planInfo.name} plan is now active
              {subscription?.expiresAt
                ? ` until ${new Date(subscription.expiresAt).toLocaleDateString()}`
                : ""}
              . A receipt has been sent to your email.
            </p>

            <div className="mt-6 w-full rounded-2xl border border-[#E3E5EA] bg-[#FAFAFB] p-4 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Amount paid</span>
                <span className="font-semibold text-[#111827]">
                  {money(planInfo.price)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Payment method</span>
                <span className="flex items-center gap-2 font-semibold text-[#111827]">
                  {selectedCard && <BrandBadge brand={selectedCard.brand} />}
                  {selectedCard ? `•••• ${selectedCard.last4}` : "Card"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.replace("/vendor/subscription")}
              className="mt-6 h-12 w-full rounded-xl text-[15px] font-semibold text-white transition-colors"
              style={{ background: ACCENT }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = ACCENT_HOVER;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = ACCENT;
              }}
            >
              Back to subscription
            </button>

            <button
              type="button"
              onClick={() => router.replace("/vendor/dashboard")}
              className="mt-3 text-sm font-medium text-[#6B7280] hover:text-[#111827]"
            >
              Go to vendor dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────── Checkout ─────────────── */
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.08)]">
        {/* Header */}
        <div className="relative flex items-center justify-center border-b border-[#EDEEF1] px-5 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close checkout"
            className="absolute left-4 rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-black/5"
          >
            <X className="size-5" />
          </button>
          <span className="font-heading text-lg font-semibold tracking-tight text-[#111827]">
            WedPlan
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 animate-spin text-[#5B6CE1]" />
            <p className="text-sm text-[#6B7280]">Preparing your checkout…</p>
          </div>
        ) : (
          <>
            {/* Order summary */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-3 border-b border-[#EDEEF1] pb-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#FFF7E6]">
                  <Crown className="size-5 text-[#C9A227]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[#111827]">
                    WedPlan {planInfo.name}
                  </span>
                  <span className="block text-[13px] text-[#8A8F98]">
                    1 × {planInfo.interval}
                  </span>
                </span>
                <span className="text-[15px] font-semibold text-[#111827]">
                  {money(planInfo.price)}
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-[#EDEEF1] py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#EEF6F1]">
                  <ShieldCheck className="size-5 text-[#2F7D5B]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[#111827]">
                    Premium activation
                  </span>
                  <span className="block text-[13px] text-[#8A8F98]">Instant</span>
                </span>
                <span className="text-[15px] font-semibold text-[#111827]">
                  Free
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-2">
              <p className="px-5 pb-1 pt-3 text-[14px] text-[#6B7280]">
                Payment method
              </p>

              <div className="divide-y divide-[#F1F2F5] border-y border-[#F1F2F5]">
                {savedCards.map((card) => (
                  <MethodRow
                    key={card.id}
                    selected={selected === card.id}
                    onSelect={() => setSelected(card.id)}
                    mark={<BrandBadge brand={card.brand} />}
                    title={
                      <>
                        <span className="font-mono tracking-wide">
                          •••• {card.last4}
                        </span>
                      </>
                    }
                    trailing={
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowSavedDetail((value) => !value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            setShowSavedDetail((value) => !value);
                          }
                        }}
                        className="flex shrink-0 items-center gap-1 text-[13px] font-medium"
                        style={{ color: ACCENT }}
                      >
                        {showSavedDetail
                          ? card.expMonth && card.expYear
                            ? `${String(card.expMonth).padStart(2, "0")}/${String(
                                card.expYear,
                              ).slice(-2)}`
                            : "Hide"
                          : "View more"}
                        <ChevronRight className="size-3.5" />
                      </span>
                    }
                  />
                ))}

                <MethodRow
                  selected={selected === "new"}
                  onSelect={() => {
                    setSelected("new");
                    if (!newCard) setModalOpen(true);
                  }}
                  mark={
                    <span className="grid h-6 w-9 place-items-center rounded bg-[#111827]">
                      <CreditCard className="size-3.5 text-white" />
                    </span>
                  }
                  title="New card"
                  trailing={
                    newCard ? (
                      <span className="flex items-center gap-2">
                        <BrandBadge brand={newCard.brand} />
                        <span className="font-mono text-[13px] text-[#6B7280]">
                          •••• {newCard.last4}
                        </span>
                      </span>
                    ) : (
                      <ChevronRight className="size-4 text-[#C9CCD4]" />
                    )
                  }
                />

                <MethodRow
                  selected={false}
                  disabled
                  onSelect={() =>
                    toast.info("Only card payments are available right now.")
                  }
                  mark={<WalletMark kind="apple" />}
                  title="Apple Pay"
                  badge="Soon"
                />

                <MethodRow
                  selected={false}
                  disabled
                  onSelect={() =>
                    toast.info("Only card payments are available right now.")
                  }
                  mark={<WalletMark kind="link" />}
                  title="Link"
                  badge="Soon"
                />

                <MethodRow
                  selected={false}
                  disabled
                  onSelect={() =>
                    toast.info("Only card payments are available right now.")
                  }
                  mark={<WalletMark kind="klarna" />}
                  title="Klarna"
                  subtitle="Buy now or pay later"
                  badge="Soon"
                />

                <MethodRow
                  selected={false}
                  disabled
                  onSelect={() =>
                    toast.info("Only card payments are available right now.")
                  }
                  mark={<WalletMark kind="cashapp" />}
                  title="Cash App Pay"
                  badge="Soon"
                />
              </div>
            </div>

            {/* Billing */}
            <div className="px-5 pt-4">
              <p className="pb-2 text-[14px] text-[#6B7280]">Billing</p>
              <div className="flex items-center justify-between border-b border-[#EDEEF1] pb-4">
                <span>
                  <span className="block text-[15px] font-medium text-[#111827]">
                    Instant activation
                  </span>
                  <span className="block text-[13px] text-[#8A8F98]">
                    Premium unlocks right after payment
                  </span>
                </span>
                <Check className="size-4 text-emerald-500" strokeWidth={3} />
              </div>
            </div>

            {/* Pay */}
            <div className="px-5 pb-6 pt-5">
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={paying}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-75"
                style={{ background: paying ? "#9AA4F0" : ACCENT }}
                onMouseEnter={(event) => {
                  if (!paying) event.currentTarget.style.background = ACCENT_HOVER;
                }}
                onMouseLeave={(event) => {
                  if (!paying) event.currentTarget.style.background = ACCENT;
                }}
              >
                {paying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : readyToPay ? (
                  <>Pay {money(planInfo.price)}</>
                ) : (
                  <>Add a card to pay {money(planInfo.price)}</>
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8A8F98]">
                <Lock className="size-3" />
                Payments securely processed by Stripe · Test mode
              </p>

              {plan === "premium_yearly" && (
                <p className="mt-2 text-center text-[12px] text-[#8A8F98]">
                  Billed once a year — cancel anytime from this page.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <AddCardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stripe={stripe}
        elements={elements}
        cardEls={cardEls}
        onReady={setCardEls}
        onCreated={(card) => {
          setNewCard(card);
          setSelected(card.id);
          setModalOpen(false);
          toast.success(`Card •••• ${card.last4} added.`);
        }}
        pendingSave={pendingSave}
        setPendingSave={setPendingSave}
      />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-[#F3F4F6] px-4 py-8 sm:py-12">
        <Suspense
          fallback={
            <div className="mx-auto flex min-h-[320px] w-full max-w-[440px] items-center justify-center">
              <Loader2 className="size-7 animate-spin text-[#5B6CE1]" />
            </div>
          }
        >
          <PaymentContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
