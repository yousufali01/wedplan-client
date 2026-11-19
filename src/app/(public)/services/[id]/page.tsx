"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import { addDemoBooking } from "@/lib/demo-bookings";
import { siteConfig } from "@/config/site";

type ServiceDetail = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  price?: number | string;
  startingPrice?: number | string;
  rating?: number;
  description?: string;
  location?: string;
  city?: string;
  image?: string;
  images?: string[];
  availability?: boolean;
  vendorId?: string;
  vendor?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
    businessName?: string;
  };
};

const DEFAULT_SERVICES_MAP: Record<string, ServiceDetail> = {
  "venue-rosewood": {
    _id: "venue-rosewood",
    name: "Rosewood Vineyard Conservatory & Estate",
    category: "Wedding Venues",
    price: 9500,
    description:
      "Private 18-acre vineyard estate accommodating up to 220 guests with a glass conservatory reception hall, heritage wine cellars, outdoor sunset lawn ceremony space, and luxurious bridal dressing suites.",
    location: "Sonoma, CA",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=85",
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
    ],
    availability: true,
    vendor: {
      name: "Atelier Lumiere Weddings",
      businessName: "Atelier Lumiere Weddings",
      email: "concierge@atelierlumiere.com",
    },
  },
  "decor-bespoke-arch": {
    _id: "decor-bespoke-arch",
    name: "Bespoke Garden Arch & Candlelit Florals",
    category: "Decoration & Florist",
    price: 3400,
    description:
      "Custom seasonal ceremony arch installation, bridal and bridesmaid bouquets, lush runner centerpieces, ambient hurricane candle walkways, and personalized wedding floral design consultations.",
    location: "San Francisco, CA",
    image:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=85",
    images: [
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
    ],
    availability: true,
    vendor: {
      name: "Atelier Lumiere Weddings",
      businessName: "Atelier Lumiere Weddings",
      email: "floral@atelierlumiere.com",
    },
  },
  "fashion-haute-couture": {
    _id: "fashion-haute-couture",
    name: "Haute Bridal Couture & Custom Gown Atelier",
    category: "Wedding Fashion",
    price: 2900,
    description:
      "Private VIP showroom appointment with European silk gowns, cathedral veils, bespoke tuxedo tailoring, custom hand-beaded lace appliques, and full bridal accessory styling.",
    location: "Beverly Hills, CA",
    image:
      "https://images.unsplash.com/photo-1594552072238-9c4c9a2c3a7b?auto=format&fit=crop&w=1400&q=85",
    images: [
      "https://images.unsplash.com/photo-1594552072238-9c4c9a2c3a7b?auto=format&fit=crop&w=1200&q=85",
    ],
    availability: true,
    vendor: {
      name: "Atelier Lumiere Weddings",
      businessName: "Atelier Lumiere Weddings",
      email: "couture@atelierlumiere.com",
    },
  },
  "photography-heritage": {
    _id: "photography-heritage",
    name: "Heritage Wedding Cinematic Photography",
    category: "Photography & Videography",
    price: 45000,
    description:
      "Capturing authentic emotions, candid laughter and timeless royal wedding portraits with 4K cinematography. Our comprehensive wedding package includes dual senior photographers, aerial drone coverage, a teaser trailer, a 30-minute cinematic feature film, and an archival heirloom photo album with 150 edited high-resolution spreads.",
    location: "Gulshan, Dhaka",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=85",
    ],
    availability: true,
    vendor: {
      name: "Heritage Studio",
      businessName: "Heritage Wedding Cinematics",
      email: "contact@heritagephoto.com",
    },
  },
  "venue-grand-palace": {
    _id: "venue-grand-palace",
    name: "The Grand Regal Palace & Convention Hall",
    category: "Wedding Venues",
    price: 180000,
    description:
      "A magnificent royal ballroom accommodating up to 1,200 guests with custom crystal chandeliers, state-of-the-art acoustic sound engineering, bridal dressing suites, VIP green rooms, and dedicated multi-level valet parking. The venue is fully air-conditioned and backed by full generator backup.",
    location: "Dhanmondi, Dhaka",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85",
    images: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85",
    ],
    availability: true,
    vendor: {
      name: "Regal Venues Group",
      businessName: "The Grand Regal Palace",
      email: "events@regalpalace.com",
    },
  },
  "decor-floral-dream": {
    _id: "decor-floral-dream",
    name: "Enchanted Garden Wedding Stage & Floral Styling",
    category: "Decoration",
    price: 65000,
    description:
      "Bespoke wedding stage styling featuring imported and seasonal fresh flowers, customized lighting setups, fairy light tunnels, royal bridal sofas, floral entryway gates, and themed guest table centerpieces designed according to your color palette.",
    location: "Banani, Dhaka",
    image: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1400&q=85",
    availability: true,
    vendor: {
      name: "Floral Dream Studio",
      businessName: "Enchanted Decorators",
      email: "info@floraldecor.com",
    },
  },
  "catering-shahi-dawat": {
    _id: "catering-shahi-dawat",
    name: "Shahi Dawat Royal Gourmet Catering",
    category: "Catering",
    price: 850,
    description:
      "Signature traditional wedding banquet including authentic Basmati Kacchi Biryani with tender mutton, succulent chicken roast, seekh kebabs, borhani, jorda, firni, and live gourmet dessert counters. Prepared with pure ghee and premium spices by master chefs.",
    location: "Uttara, Dhaka",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85",
    availability: true,
    vendor: {
      name: "Master Chef Shahi Dawat",
      businessName: "Shahi Dawat Catering",
      email: "catering@shahidawat.com",
    },
  },
  "bridal-glamour-makeover": {
    _id: "bridal-glamour-makeover",
    name: "Signature Glamour Bridal Makeup & Hair Artistry",
    category: "Bridal Makeup",
    price: 25000,
    description:
      "Exclusive high-definition waterproof airbrush bridal makeup, luxury skin preparation, intricate bridal hairstyle with real floral accents, dupatta draping, and jewelry setting. Includes a pre-wedding consultation and touch-up kit.",
    location: "Bashundhara, Dhaka",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=85",
    availability: true,
    vendor: {
      name: "Glamour by Aysha",
      businessName: "Glamour Artistry",
      email: "beauty@glamouraysha.com",
    },
  },
  "planning-perfect-moments": {
    _id: "planning-perfect-moments",
    name: "Full-Service Luxury Wedding Planning & Coordination",
    category: "Wedding Planning",
    price: 55000,
    description:
      "End-to-end wedding planning from initial concept design to final vendor negotiation, timeline management, RSVP tracking, rehearsal coordination, and dedicated on-day shadow coordinators to ensure every second unfolds flawlessly.",
    location: "Mohakhali, Dhaka",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85",
    availability: true,
    vendor: {
      name: "Perfect Moments Planning",
      businessName: "Perfect Moments Weddings",
      email: "hello@perfectmoments.com",
    },
  },
};

/** Returns true only for real 24-char hex MongoDB ObjectIds. */
function isRealMongoId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

function formatServicePrice(service: ServiceDetail): string {
  const raw = service.price ?? service.startingPrice;
  if (raw === undefined || raw === null || raw === "") return "Contact for pricing";
  if (typeof raw === "string" && (raw.includes("৳") || raw.includes("$"))) return raw;
  const num = Number(raw);
  return Number.isNaN(num) ? String(raw) : `৳${num.toLocaleString("en-BD")}`;
}

/** Backend rejects today's date (Date.now()), so the picker starts tomorrow. */
function getTomorrowISO(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ServiceDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isPending, isAuthenticated } = useAuth();
  const serviceId = (params?.id as string) || "";
  const isDemo = !isRealMongoId(serviceId);

  const [service, setService] = React.useState<ServiceDetail | null>(null);
  const [activeImage, setActiveImage] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [minDate, setMinDate] = React.useState<string>('');
  React.useEffect(() => {
    setMinDate(getTomorrowISO());
  }, []);

  // Authentication check: redirect to sign-in if not logged in
  React.useEffect(() => {
    if (!isPending && !isAuthenticated) {
      toast.info("Please sign in to view wedding service details.");
      router.replace(
        `${siteConfig.routes.signIn}?callbackURL=${encodeURIComponent(`/services/${serviceId}`)}`
      );
    }
  }, [isPending, isAuthenticated, router, serviceId]);

  // Booking Form States
  const [eventDate, setEventDate] = React.useState("");
  const [guestCount, setGuestCount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadService() {
      setIsLoading(true);
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:5000";
        const apiUrl = `${baseUrl.replace(/\/+$/, "")}/api/v1/services/${serviceId}`;

        const response = await fetch(apiUrl, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data?.service) {
            setService(data.service);
            setActiveImage(data.service.image || data.service.images?.[0] || "");
            return;
          }
        }

        // Check fallback map
        if (DEFAULT_SERVICES_MAP[serviceId]) {
          const fallback = DEFAULT_SERVICES_MAP[serviceId];
          setService(fallback);
          setActiveImage(fallback.image || fallback.images?.[0] || "");
          return;
        }

        // Otherwise fallback to first default service
        const first = DEFAULT_SERVICES_MAP["photography-heritage"];
        setService({ ...first, _id: serviceId, name: `${first.name} (${serviceId})` });
        setActiveImage(first.image || "");
      } catch {
        const fallback =
          DEFAULT_SERVICES_MAP[serviceId] ||
          DEFAULT_SERVICES_MAP["photography-heritage"];
        setService(fallback);
        setActiveImage(fallback.image || "");
      } finally {
        setIsLoading(false);
      }
    }

    if (serviceId) {
      void loadService();
    }
  }, [serviceId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to book this wedding service.", {
        action: {
          label: "Sign In",
          onClick: () => router.push(`${siteConfig.routes.signIn}?callbackURL=/services/${serviceId}`),
        },
      });
      return;
    }

    if (!eventDate || new Date(eventDate).getTime() <= Date.now()) {
      toast.error("Please select a valid future event date.");
      return;
    }

    if (service?.availability === false) {
      toast.error("This service is currently unavailable for booking.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Normalise _id — the API returns it as a string hex, but guard anyway
      const resolvedServiceId =
        (typeof service?._id === "string"
          ? service._id
          : service?._id
            ? String(service._id)
            : null) ?? serviceId;

      if (isDemo) {
        // Curated listings are not in MongoDB, so the API would 404.
        addDemoBooking({
          customerId: user.id,
          serviceId: resolvedServiceId,
          serviceName: service?.name || service?.title || "Wedding Service",
          serviceCategory: service?.category,
          serviceImage: service?.image || service?.images?.[0] || null,
          servicePrice: service?.price ?? service?.startingPrice,
          eventDate,
          guestCount: guestCount ? parseInt(guestCount, 10) : null,
          notes,
        });
      } else {
        await apiRequest("/api/v1/bookings", {
          method: "POST",
          body: JSON.stringify({
            serviceId: resolvedServiceId,
            eventDate,
            guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
            notes,
          }),
        });
      }

      setBookingSuccess(true);
      toast.success("Booking request sent successfully!", {
        description: isDemo
          ? "Saved to My Bookings so you can track or cancel it anytime."
          : "The vendor will review your request and get in touch.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create booking request.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending || !isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isPending || !isAuthenticated
            ? "Verifying authentication..."
            : "Loading wedding service details..."}
        </p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h2 className="font-heading text-2xl font-bold">Service Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The wedding service you are looking for is unavailable or does not exist.
        </p>
        <Button
          render={<Link href={siteConfig.routes.services} />}
          className="mt-6 gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to Browse Services
        </Button>
      </div>
    );
  }

  const serviceName = service.name || service.title || "Wedding Service";
  const priceDisplay = formatServicePrice(service);

  const imagesList = service.images && service.images.length > 0
    ? service.images
    : [service.image || activeImage];

  return (
    <div className="min-h-screen bg-[#FAF8F2] pb-20 text-[#183D2D]">
      {/* ================= BREADCRUMBS & TOP BAR ================= */}
      <div className="border-b border-[#E8E1D3] bg-white px-5 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 overflow-hidden">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-primary transition">
              Services
            </Link>
            <span>/</span>
            <span className="truncate font-medium text-foreground">
              {serviceName}
            </span>
          </div>

          <Link
            href="/services"
            className="flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            All Services
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* ================= LEFT 2 COLS: GALLERY & SERVICE INFO ================= */}
          <div className="space-y-8 lg:col-span-2">
            {/* Main Featured Image */}
            <div className="relative h-[380px] sm:h-[480px] overflow-hidden rounded-3xl border border-[#E8E1D3] bg-muted shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500"
                style={{
                  backgroundImage: `url('${activeImage || service.image}')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

              <span className="absolute left-5 top-5 rounded-full border border-[#D5B66D]/40 bg-[#183D2D]/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#D5B66D] backdrop-blur-md">
                {service.category || "Wedding Service"}
              </span>

              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-[#D5B66D]" />
                  <span>
                    {service.city || service.location || "Location on request"}
                  </span>
                </div>

                {service.availability === false ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Clock size={13} />
                    Currently Unavailable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <CheckCircle2 size={13} />
                    Available for Booking
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Row if multiple images */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imagesList.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === img ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className="size-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${img}')` }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Metadata Card */}
            <div className="rounded-3xl border border-[#E8E1D3] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E1D3] pb-6">
                <div>
                  {typeof service.rating === "number" ? (
                    <div className="mb-2 flex items-center gap-1.5 text-[#C3A45D]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= Math.round(service.rating ?? 0) ? "currentColor" : "none"}
                        />
                      ))}
                      <span className="ml-2 text-xs font-semibold text-muted-foreground">
                        {service.rating.toFixed(1)} (Verified Wedding Reviews)
                      </span>
                    </div>
                  ) : (
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <ShieldCheck size={13} />
                      WedPlan Verified Partner
                    </span>
                  )}

                  <h1 className="font-heading text-2xl font-bold sm:text-3xl text-[#183D2D]">
                    {serviceName}
                  </h1>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Starting Package
                  </p>
                  <p className="font-heading text-3xl font-bold text-primary">
                    {priceDisplay}
                  </p>
                </div>
              </div>

              {/* Service Description */}
              <div className="mt-6">
                <h2 className="font-heading text-lg font-bold text-[#183D2D]">
                  About This Service
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#555E53] whitespace-pre-line">
                  {service.description ||
                    "This wedding professional delivers exceptional hospitality and timeless craftsmanship, curating an unforgettable wedding celebration tailored to your desires."}
                </p>
              </div>

              {/* Features Guarantee */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-[#E8E1D3] pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      WedPlan Verified Partner
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Background-checked wedding professional with proven reviews.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#D5B66D]/20 text-[#183D2D]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Flexible Rescheduling
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Peace of mind protection for unexpected wedding date changes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Quick Response Guarantee
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Direct response from the vendor team within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Transparent Pricing
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Zero hidden service fees; pay directly as agreed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Information Box */}
            <div className="flex items-center justify-between rounded-3xl border border-[#E8E1D3] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#183D2D] font-heading text-xl font-bold text-[#D5B66D]">
                  {service.vendor?.image ? (
                    <div
                      className="size-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${service.vendor.image}')` }}
                    />
                  ) : (
                    (service.vendor?.businessName || service.vendor?.name || "W")[0]
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-[#183D2D]">
                      {service.vendor?.businessName || service.vendor?.name || "Official WedPlan Partner"}
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {service.vendor?.email || "Contact via booking request"}
                  </p>
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <span className="text-xs font-semibold text-primary">
                  {service.category || "Wedding Service"}
                </span>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {service.city || service.location || "Location on request"}
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COL: BOOKING REQUEST CARD ================= */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-[#D8CBAA] bg-white p-6 sm:p-7 shadow-lg">
              <div className="border-b border-[#E8E1D3] pb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B4934C]">
                  Book This Vendor
                </span>
                <h3 className="mt-1 font-heading text-2xl font-bold text-[#183D2D]">
                  Request a Booking
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Send your preferred wedding date and details to reserve your slot.
                </p>
              </div>

              {bookingSuccess ? (
                <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="size-7" />
                  </div>
                  <h4 className="mt-4 font-heading text-lg font-bold">
                    Booking Request Sent!
                  </h4>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {isDemo
                      ? "Your sample-listing request is saved. Track or cancel it from My Bookings."
                      : "Your request has been submitted to the vendor. You can monitor status updates in your dashboard."}
                  </p>
                  <Button
                    render={<Link href={siteConfig.routes.bookings} />}
                    className="mt-6 w-full"
                  >
                    View My Bookings
                  </Button>
                </div>
              ) : service.availability === false ? (
                <div className="mt-6 flex flex-col items-center gap-4 text-center py-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Clock className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-heading text-base font-bold text-[#183D2D]">
                      Currently Unavailable
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      This vendor is not accepting new bookings right now. Please
                      browse other services for your date.
                    </p>
                  </div>
                  <Button
                    render={<Link href="/services" />}
                    className="mt-2 w-full"
                  >
                    Browse Other Services
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="mt-5 space-y-4">
                  {isDemo && (
                    <div className="rounded-xl border border-[#E8E1D3] bg-[#FAF8F2] px-3 py-2 text-[11px] leading-5 text-[#555E53]">
                      Curated sample listing — pick a date below and your request
                      will be saved locally in My Bookings.
                    </div>
                  )}
                  {/* Event Date */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#183D2D]">
                      Wedding / Event Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={minDate}
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF8F2] px-3.5 py-2.5 text-xs text-[#183D2D] outline-none focus:border-primary focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Estimated Guests */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#183D2D]">
                      Estimated Guests (optional)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 350"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF8F2] px-3.5 py-2.5 text-xs text-[#183D2D] outline-none focus:border-primary focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#183D2D]">
                      Notes & Custom Requests
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share your wedding theme, venue location or special preferences..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF8F2] p-3 text-xs text-[#183D2D] outline-none focus:border-primary focus:bg-white resize-none"
                    />
                  </div>

                  {/* Total & Submit */}
                  <div className="rounded-xl bg-[#FAF8F2] p-3.5 text-xs">
                    <div className="flex justify-between font-semibold text-[#183D2D]">
                      <span>Estimated Package:</span>
                      <span className="font-bold">{priceDisplay}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      No payment required upfront. The vendor will confirm their
                      availability first.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-[#183D2D] py-3 text-xs font-semibold text-white shadow hover:bg-[#D5B66D] hover:text-[#183D2D] transition duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Submitting Request...
                      </>
                    ) : (
                      "Request Booking"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading wedding service details...</p>
        </div>
      }
    >
      <ServiceDetailsContent />
    </React.Suspense>
  );
}
