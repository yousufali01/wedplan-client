"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Loader2,
  Receipt,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/api";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "customer" | "vendor" | "admin";
  vendorApproved?: boolean;
  createdAt?: string;
};

type PendingVendor = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt?: string;
};

export default function AdminDashboardOverviewPage() {
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [pendingVendors, setPendingVendors] = React.useState<PendingVendor[]>([]);
  const [servicesCount, setServicesCount] = React.useState<number>(0);
  const [transactionsCount, setTransactionsCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  const fetchAdminData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, pendingRes, servicesRes, transRes] = await Promise.allSettled([
        apiRequest<{ users: UserRecord[]; total: number }>("/api/v1/admin/users"),
        apiRequest<{ vendors: PendingVendor[]; total: number }>("/api/v1/admin/vendors/pending"),
        apiRequest<{ services: unknown[]; total: number }>("/api/v1/admin/services"),
        apiRequest<{ total: number }>("/api/v1/admin/transactions"),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value.users) {
        setUsers(usersRes.value.users);
      }
      if (pendingRes.status === "fulfilled" && pendingRes.value.vendors) {
        setPendingVendors(pendingRes.value.vendors);
      }
      if (servicesRes.status === "fulfilled" && typeof servicesRes.value.total === "number") {
        setServicesCount(servicesRes.value.total);
      }
      if (transRes.status === "fulfilled" && typeof transRes.value.total === "number") {
        setTransactionsCount(transRes.value.total);
      }
    } catch (err) {
      toast.error("Could not fetch admin data", {
        description: err instanceof Error ? err.message : "Please check backend connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAdminData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAdminData]);

  const handleVendorApproval = async (vendorId: string, approved: boolean) => {
    setActionInProgress(vendorId);
    try {
      await apiRequest(`/api/v1/admin/vendors/${vendorId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });

      toast.success(
        approved ? "Vendor approved successfully!" : "Vendor application rejected."
      );

      setPendingVendors((prev) => prev.filter((v) => v.id !== vendorId));
      void fetchAdminData();
    } catch (err) {
      toast.error("Failed to update vendor status", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Heading */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Platform Administration
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              Admin Governance
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Admin Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor platform activity, moderate wedding vendors, inspect catalog services, and review financials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchAdminData()}
          disabled={isLoading}
          className="gap-2 border-[#e9e1d8] bg-white w-fit"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Link
          href="/admin/users"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Users</span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="font-heading text-3xl font-semibold">{users.length}</p>
          <p className="text-xs text-muted-foreground">Manage roles & access →</p>
        </Link>

        {/* Pending Vendors */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Vendors</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="font-heading text-3xl font-semibold text-amber-600">
            {pendingVendors.length}
          </p>
          <p className="text-xs text-muted-foreground">Awaiting your approval</p>
        </div>

        {/* Total Services */}
        <Link
          href="/admin/services"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Listed Services</span>
            <BriefcaseBusiness className="size-4 text-emerald-600" />
          </div>
          <p className="font-heading text-3xl font-semibold">{servicesCount}</p>
          <p className="text-xs text-muted-foreground">Moderate catalog →</p>
        </Link>

        {/* Total Transactions */}
        <Link
          href="/admin/transactions"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Transactions</span>
            <Receipt className="size-4 text-gold" />
          </div>
          <p className="font-heading text-3xl font-semibold text-foreground">
            {transactionsCount}
          </p>
          <p className="text-xs text-muted-foreground">View financial ledger →</p>
        </Link>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="group rounded-2xl border border-[#e9e1d8] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Users className="size-5" />
          </div>
          <h2 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition">
            Manage Users
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Search users, adjust account privileges, promote to vendor or admin.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
            Open Users <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/admin/services"
          className="group rounded-2xl border border-[#e9e1d8] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <BriefcaseBusiness className="size-5" />
          </div>
          <h2 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition">
            Manage Services
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Review submitted wedding packages, approve pending services, remove violations.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
            Open Services <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/admin/transactions"
          className="group rounded-2xl border border-[#e9e1d8] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Receipt className="size-5" />
          </div>
          <h2 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition">
            Transactions
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Audit couple booking volumes and vendor subscription settlements.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
            Open Ledger <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Pending Vendor Applications Queue */}
      <section className="rounded-2xl border border-[#e9e1d8] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e9e1d8] p-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Pending Vendor Approvals
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Vendors awaiting platform verification to publish wedding services.
              </p>
            </div>

            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {pendingVendors.length} In Queue
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[150px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : pendingVendors.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              All Caught Up!
            </h3>
            <p className="text-xs text-muted-foreground">
              There are no pending vendor applications awaiting review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eee8e0]">
            {pendingVendors.map((vendor) => {
              const isWorking = actionInProgress === vendor.id;

              return (
                <div
                  key={vendor.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-[#faf9f6] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size="default">
                      {vendor.image && (
                        <AvatarImage src={vendor.image} alt={vendor.name} />
                      )}
                      <AvatarFallback className="font-semibold text-amber-700 bg-amber-100">
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {vendor.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vendor.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isWorking}
                      onClick={() => handleVendorApproval(vendor.id, true)}
                      className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      {isWorking ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      Approve
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isWorking}
                      onClick={() => handleVendorApproval(vendor.id, false)}
                      className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
