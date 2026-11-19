"use client";

import * as React from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

type ServiceItem = {
  _id: string;
  name: string;
  category: string;
  price: number;
  location?: string;
  description?: string;
  image?: string;
  availability: boolean;
  status?: "approved" | "pending" | "rejected";
  vendorId?: string;
  createdAt?: string;
};

export default function AdminServicesPage() {
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ services: ServiceItem[]; total: number }>(
        "/api/v1/admin/services"
      );
      if (res.services) {
        setServices(res.services);
      }
    } catch (err) {
      toast.error("Failed to fetch services", {
        description: err instanceof Error ? err.message : "Please check connection.",
      });
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

  const handleReviewStatus = async (serviceId: string, status: "approved" | "rejected") => {
    setActionInProgress(serviceId);
    try {
      await apiRequest(`/api/v1/services/${serviceId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      toast.success(`Service ${status} successfully.`);
      setServices((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, status } : s))
      );
    } catch (err) {
      toast.error("Review action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Are you sure you want to delete this wedding service?")) return;

    setActionInProgress(serviceId);
    try {
      await apiRequest(`/api/v1/services/${serviceId}`, {
        method: "DELETE",
      });

      toast.success("Service deleted from platform.");
      setServices((prev) => prev.filter((s) => s._id !== serviceId));
    } catch (err) {
      toast.error("Failed to delete service", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredServices = React.useMemo(() => {
    return services.filter((s) => {
      const sStatus = s.status || "approved";
      const matchesStatus = statusFilter === "all" || sStatus === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.location || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [services, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Catalog Governance
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              {services.length} Listed Services
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Manage Wedding Services
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve vendor submissions, review catalog listings, and moderate published packages.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchServices()}
          disabled={isLoading}
          className="gap-2 border-[#e9e1d8] bg-white w-fit"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e9e1d8] bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by service name, category or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e6dfd5] bg-transparent py-2 pl-9 pr-3 text-xs outline-none focus:border-primary sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#e6dfd5] bg-white px-3 py-2 text-xs font-medium outline-none cursor-pointer focus:border-primary"
          >
            <option value="all">All Services ({services.length})</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Services List / Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e9e1d8] bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading wedding services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center">
            <BriefcaseBusiness className="size-10 text-muted-foreground" />
            <h3 className="mt-3 font-heading text-lg font-semibold">No Services Found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              No services match your search or selected status.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eee8e0]">
            {filteredServices.map((s) => {
              const isWorking = actionInProgress === s._id;
              const status = s.status || "approved";

              return (
                <div
                  key={s._id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-[#faf9f6] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative size-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                      {s.image ? (
                        <div
                          className="size-full bg-cover bg-center"
                          style={{ backgroundImage: `url('${s.image}')` }}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-primary/10 text-primary">
                          <BriefcaseBusiness className="size-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-foreground">
                          {s.name}
                        </h2>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {status}
                        </span>

                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground border border-border">
                          {s.category}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          ৳{Number(s.price).toLocaleString("en-BD")}
                        </span>
                        {s.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {s.location}
                          </span>
                        )}
                        <span>
                          {s.availability ? "• Available" : "• Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Link
                      href={`/services/${s._id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e6dfd5] bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      <Eye className="size-3.5" />
                      View
                    </Link>

                    {status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleReviewStatus(s._id, "approved")}
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleReviewStatus(s._id, "rejected")}
                          className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isWorking}
                      onClick={() => handleDeleteService(s._id)}
                      className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
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
