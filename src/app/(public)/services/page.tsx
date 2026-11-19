"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";

type Service = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  serviceName?: string;
  category?: string;
  description?: string;
  price?: number | string;
  startingPrice?: number | string;
  location?: string;
  city?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  photos?: string[];
  availability?: boolean;
  featured?: boolean;
  vendorName?: string;
  vendorTitle?: string;
  vendorAvatar?: string;
  vendor?: {
    id?: string;
    name?: string;
    businessName?: string;
    image?: string | null;
  };
};

const CATEGORIES = [
  "All Categories",
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
  "Other",
];

const DEFAULT_SERVICES: Service[] = [
  {
    _id: "venue-rosewood",
    id: "venue-rosewood",
    title: "Rosewood Vineyard Conservatory & Estate",
    name: "Rosewood Vineyard Conservatory & Estate",
    category: "Wedding Venues",
    location: "Sonoma, CA",
    price: "$9,500",
    description:
      "Private 18-acre vineyard estate accommodating up to 220 guests with a glass conservatory reception hall, heritage wine cellars and bridal dressing suites.",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85",
    vendorName: "Atelier Lumiere Weddings",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "decor-bespoke-arch",
    id: "decor-bespoke-arch",
    title: "Bespoke Garden Arch & Candlelit Florals",
    name: "Bespoke Garden Arch & Candlelit Florals",
    category: "Decoration & Florist",
    location: "San Francisco, CA",
    price: "$3,400",
    description:
      "Custom seasonal ceremony arch installation, bridal and bridesmaid bouquets, lush runner centerpieces and romantic twinkling aisle hurricane candles.",
    image:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=85",
    vendorName: "Atelier Lumiere Weddings",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "fashion-haute-couture",
    id: "fashion-haute-couture",
    title: "Haute Bridal Couture & Custom Gown Atelier",
    name: "Haute Bridal Couture & Custom Gown Atelier",
    category: "Wedding Fashion",
    location: "Beverly Hills, CA",
    price: "$2,900",
    description:
      "Private showroom appointment with European silk gowns, cathedral veils, bespoke tuxedo tailoring and customized bridal accessory styling.",
    image:
      "https://images.unsplash.com/photo-1594552072238-9c4c9a2c3a7b?auto=format&fit=crop&w=900&q=85",
    vendorName: "Atelier Lumiere Weddings",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "photography-heritage",
    id: "photography-heritage",
    title: "Heritage Wedding Cinematic Photography & Film",
    name: "Heritage Wedding Cinematic Photography & Film",
    category: "Photography & Videography",
    location: "Gulshan, Dhaka",
    price: "৳45,000",
    description:
      "Capturing authentic emotions, candid laughter and timeless royal wedding portraits with 4K cinematography, drone aerials and heirloom albums.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85",
    vendorName: "Heritage Studio",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "venue-grand-palace",
    id: "venue-grand-palace",
    title: "The Grand Regal Palace & Convention Hall",
    name: "The Grand Regal Palace & Convention Hall",
    category: "Wedding Venues",
    location: "Dhanmondi, Dhaka",
    price: "৳180,000",
    description:
      "Luxurious crystal ballroom accommodating up to 1,200 guests with customized lighting, bridal dressing suites and VIP valet parking.",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85",
    vendorName: "Regal Venues Group",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "catering-shahi-dawat",
    id: "catering-shahi-dawat",
    title: "Shahi Dawat Royal Gourmet Banquet & Live Stations",
    name: "Shahi Dawat Royal Gourmet Banquet & Live Stations",
    category: "Catering",
    location: "Uttara, Dhaka",
    price: "৳850",
    description:
      "Authentic Basmati Kacchi biryani, slow-cooked royal roast, traditional mutton seekh kebabs, borhani and gourmet live dessert counters.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85",
    vendorName: "Shahi Dawat Catering",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "bridal-glamour-makeover",
    id: "bridal-glamour-makeover",
    title: "Signature Glamour Bridal Makeup & Hair Artistry",
    name: "Signature Glamour Bridal Makeup & Hair Artistry",
    category: "Bridal Makeup",
    location: "Bashundhara, Dhaka",
    price: "৳25,000",
    description:
      "Exclusive high-definition waterproof airbrush bridal makeover, luxury skin prep, real floral bridal hair styling and jewelry setting.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=85",
    vendorName: "Glamour by Aysha",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
  {
    _id: "planning-perfect-moments",
    id: "planning-perfect-moments",
    title: "Full-Service Luxury Wedding Planning & Coordination",
    name: "Full-Service Luxury Wedding Planning & Coordination",
    category: "Wedding Planning",
    location: "Banani, Dhaka",
    price: "৳55,000",
    description:
      "End-to-end wedding management, trusted vendor negotiation, rehearsal coordination and dedicated on-day shadow coordinators for flawless execution.",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85",
    vendorName: "Perfect Moments Weddings",
    vendorTitle: "Premium Vendor",
    vendorAvatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    availability: true,
  },
];

function getServiceName(service: Service): string {
  return service.title || service.name || service.serviceName || "Wedding Service";
}

function getServiceImage(service: Service): string {
  return (
    service.imageUrl ||
    service.image ||
    service.images?.[0] ||
    service.photos?.[0] ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85"
  );
}

function formatPriceDisplay(service: Service): string {
  const p = service.price ?? service.startingPrice;
  if (p === undefined || p === null || p === "") return "Contact";
  if (typeof p === "string" && (p.includes("$") || p.includes("৳"))) return p;
  const num = Number(p);
  return Number.isNaN(num) ? String(p) : `৳${num.toLocaleString("en-BD")}`;
}

function parsePriceNumber(service: Service): number {
  const p = service.price ?? service.startingPrice;
  if (typeof p === "number") return p;
  if (typeof p === "string") {
    const clean = Number(p.replace(/[^0-9.]/g, ""));
    return Number.isNaN(clean) ? 0 : clean;
  }
  return 0;
}

function BrowseServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [services, setServices] = React.useState<Service[]>(DEFAULT_SERVICES);
  const [isLoading, setIsLoading] = React.useState(true);

  const urlCategory = searchParams.get("category");

  // Filters state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [locationFilter, setLocationFilter] = React.useState("");
  const [sortOption, setSortOption] = React.useState<"featured" | "price-low" | "price-high">("featured");

  // Submitted search terms
  const [activeSearch, setActiveSearch] = React.useState("");
  const [activeCategoryState, setActiveCategoryState] = React.useState<string | null>(null);
  const [activeLocation, setActiveLocation] = React.useState("");
  const [activeSort, setActiveSort] = React.useState<"featured" | "price-low" | "price-high">("featured");

  const categoryFilter = selectedCategory ?? (urlCategory || "All Categories");
  const activeCategory = activeCategoryState ?? (urlCategory || "All Categories");

  const handleViewDetails = React.useCallback(
    (e: React.MouseEvent, serviceId: string) => {
      if (!isAuthenticated) {
        e.preventDefault();
        toast.info("Please sign in to view wedding service details.");
        router.push(
          `${siteConfig.routes.signIn}?callbackURL=${encodeURIComponent(`/services/${serviceId}`)}`
        );
      }
    },
    [isAuthenticated, router]
  );

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";
      const apiUrl = `${baseUrl.replace(/\/+$/, "")}/api/v1/services`;

      const response = await fetch(apiUrl, { cache: "no-store" });
      if (response.ok) {
        const result = await response.json();
        const list = Array.isArray(result)
          ? result
          : result.services ||
            result.data ||
            result.result ||
            [];

        if (Array.isArray(list) && list.length > 0) {
          const merged = [...list];
          DEFAULT_SERVICES.forEach((def) => {
            if (!merged.some((s) => (s._id || s.id) === (def._id || def.id))) {
              merged.push(def);
            }
          });
          setServices(merged);
          return;
        }
      }
      setServices(DEFAULT_SERVICES);
    } catch {
      setServices(DEFAULT_SERVICES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchServices();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setActiveCategoryState(categoryFilter);
    setActiveLocation(locationFilter);
    setActiveSort(sortOption);
  };

  const filteredServices = React.useMemo(() => {
    return services
      .filter((service) => {
        const sCat = (service.category || "").toLowerCase();
        const aCat = activeCategory.toLowerCase();
        const matchesCategory =
          activeCategory === "All Categories" ||
          sCat === aCat ||
          sCat.includes(aCat) ||
          aCat.includes(sCat) ||
          (aCat.includes("cater") && sCat.includes("cater")) ||
          (aCat.includes("photo") && sCat.includes("photo")) ||
          (aCat.includes("decor") && sCat.includes("decor")) ||
          (aCat.includes("venue") && sCat.includes("venue")) ||
          (aCat.includes("fashion") && sCat.includes("fashion")) ||
          (aCat.includes("makeup") && (sCat.includes("makeup") || sCat.includes("bridal")));

        const name = getServiceName(service).toLowerCase();
        const desc = (service.description || "").toLowerCase();
        const searchQ = activeSearch.trim().toLowerCase();
        const matchesSearch =
          !searchQ || name.includes(searchQ) || desc.includes(searchQ);

        const loc = (service.location || service.city || "").toLowerCase();
        const locQ = activeLocation.trim().toLowerCase();
        const matchesLoc = !locQ || loc.includes(locQ);

        return matchesCategory && matchesSearch && matchesLoc;
      })
      .sort((a, b) => {
        if (activeSort === "price-low") {
          return parsePriceNumber(a) - parsePriceNumber(b);
        }
        if (activeSort === "price-high") {
          return parsePriceNumber(b) - parsePriceNumber(a);
        }
        return 0;
      });
  }, [services, activeCategory, activeSearch, activeLocation, activeSort]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#222]">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* ================= TOP EYEBROW + HEADER ================= */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5 text-gold" />
            Curated Wedding Marketplace
          </span>

          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-[#183D2D] sm:text-5xl">
            Browse Wedding Services
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#555E53] sm:text-base">
            Search verified photographers, dream venues, florists, caterers, and
            stylists. Sign in to view full galleries and send booking requests.
          </p>
        </div>

        {/* ================= SEARCH & FILTER BAR ================= */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 rounded-2xl border border-[#ede7de] bg-white p-3 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.1fr_1.2fr_1.1fr_auto] items-center">
            {/* 1. Keyword search */}
            <div className="relative flex items-center rounded-xl border border-[#e6dfd5] bg-white px-3 py-2.5 focus-within:border-primary transition">
              <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Search service name or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#183D2D] placeholder:text-[#888] outline-none"
              />
            </div>

            {/* 2. Category select */}
            <div className="relative flex items-center rounded-xl border border-[#e6dfd5] bg-white px-3 py-2.5 focus-within:border-primary transition">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setActiveCategoryState(e.target.value);
                }}
                className="w-full bg-transparent text-xs sm:text-sm text-[#183D2D] outline-none cursor-pointer pr-6 appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-[#888]" />
            </div>

            {/* 3. Location filter */}
            <div className="relative flex items-center rounded-xl border border-[#e6dfd5] bg-white px-3 py-2.5 focus-within:border-primary transition">
              <MapPin className="size-4 shrink-0 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Filter by city / location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#183D2D] placeholder:text-[#888] outline-none"
              />
            </div>

            {/* 4. Sort select */}
            <div className="relative flex items-center rounded-xl border border-[#e6dfd5] bg-white px-3 py-2.5 focus-within:border-primary transition">
              <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground mr-2" />
              <select
                value={sortOption}
                onChange={(e) =>
                  setSortOption(
                    e.target.value as "featured" | "price-low" | "price-high"
                  )
                }
                className="w-full bg-transparent text-xs sm:text-sm text-[#183D2D] outline-none cursor-pointer pr-6 appearance-none"
              >
                <option value="featured">Featured & Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-[#888]" />
            </div>

            {/* 5. Submit button */}
            <button
              type="submit"
              className="h-11 rounded-xl bg-[#183D2D] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#122e22] flex items-center justify-center cursor-pointer shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* ================= RESULTS COUNT TEXT ================= */}
        <div className="mt-7">
          <p className="text-sm font-medium text-[#777]">
            Showing {filteredServices.length} of {services.length} approved
            wedding services
          </p>
        </div>

        {/* ================= CARDS GRID ================= */}
        {isLoading ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading wedding services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#ede7de] bg-white p-8 text-center">
            <p className="font-heading text-lg font-bold text-[#183D2D]">
              No wedding services found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search criteria or resetting filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setActiveCategoryState("All Categories");
                setLocationFilter("");
                setSortOption("featured");
                setActiveSearch("");
                setActiveLocation("");
                setActiveSort("featured");
              }}
              className="mt-4 rounded-xl bg-[#183D2D] px-5 py-2 text-xs font-semibold text-white hover:bg-[#122e22]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service, index) => {
              const serviceId = service._id || service.id || `service-${index}`;
              const title = getServiceName(service);
              const priceTag = formatPriceDisplay(service);
              const image = getServiceImage(service);
              const vendor =
                service.vendorName ||
                service.vendor?.businessName ||
                service.vendor?.name ||
                "WedPlan Partner";
              const vendorTitle = service.vendorTitle || "Verified Wedding Vendor";
              const avatar =
                service.vendorAvatar || service.vendor?.image || "";

              return (
                <div
                  key={serviceId}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#ede7de] bg-white shadow-sm transition duration-300 hover:shadow-md"
                >
                  {/* Image with badges */}
                  <div className="relative h-[230px] w-full overflow-hidden bg-muted">
                    <div
                      className="size-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${image}')` }}
                    />

                    {/* Top badges */}
                    <div className="absolute left-3 top-3 right-3 flex items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#183D2D] shadow-sm backdrop-blur-sm border border-[#ede7de]">
                        {service.category || "Wedding Service"}
                      </span>

                      {service.featured ? (
                        <span className="flex items-center gap-1 rounded-full border border-[#f5df9a] bg-[#fdf6e2]/95 px-3 py-1 text-xs font-semibold text-[#966b12] shadow-sm backdrop-blur-sm">
                          <Sparkles className="size-3 text-gold" />
                          Featured Partner
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#e6dfd5] bg-white/95 px-3 py-1 text-xs font-semibold text-[#555E53] shadow-sm backdrop-blur-sm">
                          Verified Partner
                        </span>
                      )}
                    </div>

                    {/* Price tag on bottom right */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3.5 py-1 text-xs font-bold text-white shadow backdrop-blur-sm">
                      {priceTag}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Title */}
                    <h2 className="font-heading text-lg font-bold text-[#183D2D] line-clamp-1 group-hover:text-primary transition">
                      {title}
                    </h2>

                    {/* Location */}
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#78716c]">
                      <MapPin className="size-3.5 shrink-0 text-primary/70" />
                      <span className="truncate">
                        {service.location ||
                          service.city ||
                          "Location on request"}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-xs leading-relaxed text-[#555E53] line-clamp-2 min-h-[36px]">
                      {service.description ||
                        "A curated wedding service from a verified WedPlan partner. Open for details to see the full package and availability."}
                    </p>

                    {/* Vendor info footer */}
                    <div className="mt-4 flex items-center gap-2.5 border-t border-[#f0eae1] pt-3.5">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={vendor}
                          className="size-8 rounded-full bg-muted object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {vendor.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#183D2D] leading-tight">
                          {vendor}
                        </p>
                        <p className="text-[11px] text-[#888] leading-tight mt-0.5">
                          {vendorTitle}
                        </p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Link
                      href={`${siteConfig.routes.services}/${serviceId}`}
                      onClick={(e) => handleViewDetails(e, serviceId)}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#183D2D] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#122e22]"
                    >
                      View Details
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowseServicesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <BrowseServicesContent />
    </React.Suspense>
  );
}
