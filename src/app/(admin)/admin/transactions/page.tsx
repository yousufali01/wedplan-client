"use client";

import * as React from "react";
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

type TransactionItem = {
  id: string;
  type: "booking" | "subscription";
  title: string;
  customer: string;
  vendor: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  eventDate?: string;
};

type TransactionsResponse = {
  total: number;
  transactions: TransactionItem[];
  summary: {
    totalBookingValue: number;
    totalSubRevenue: number;
    totalBookings: number;
    activeSubscriptions: number;
  };
};

export default function AdminTransactionsPage() {
  const [data, setData] = React.useState<TransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<TransactionsResponse>(
        "/api/v1/admin/transactions"
      );
      setData(res);
    } catch (err) {
      toast.error("Failed to load transactions", {
        description: err instanceof Error ? err.message : "Please check connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTransactions();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const filtered = React.useMemo(() => {
    const list = data?.transactions || [];
    return list.filter((t) => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q) ||
        t.vendor.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [data?.transactions, typeFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Financial Records
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              {data?.total ?? 0} Recorded Transactions
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Platform Transactions & Billing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit couple booking volumes, vendor premium subscriptions, and settlement status.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchTransactions()}
          disabled={isLoading}
          className="gap-2 border-[#e9e1d8] bg-white w-fit"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Confirmed Booking Value
            </span>
            <Receipt className="size-4 text-primary" />
          </div>
          <p className="font-heading text-2xl font-bold text-primary">
            ৳{(data?.summary?.totalBookingValue ?? 0).toLocaleString("en-BD")}
          </p>
          <p className="text-xs text-muted-foreground">
            {data?.summary?.totalBookings ?? 0} total reservations
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Subscription Revenue
            </span>
            <DollarSign className="size-4 text-gold" />
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">
            ${(data?.summary?.totalSubRevenue ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {data?.summary?.activeSubscriptions ?? 0} active premium vendors
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Logged Records
            </span>
            <CreditCard className="size-4 text-sky-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-sky-700">
            {data?.total ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            All platform financial events
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Settlement Status
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-emerald-700">
            Active
          </p>
          <p className="text-xs text-muted-foreground">
            Live database ledger verified
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e9e1d8] bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, client, vendor or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e6dfd5] bg-transparent py-2 pl-9 pr-3 text-xs outline-none focus:border-primary sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[#e6dfd5] bg-white px-3 py-2 text-xs font-medium outline-none cursor-pointer focus:border-primary"
          >
            <option value="all">All Transactions</option>
            <option value="booking">Wedding Bookings</option>
            <option value="subscription">Vendor Subscriptions</option>
          </select>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="overflow-hidden rounded-2xl border border-[#e9e1d8] bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading transaction records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center">
            <Receipt className="size-10 text-muted-foreground" />
            <h3 className="mt-3 font-heading text-lg font-semibold">No Transactions Found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              No financial records match your current filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eee8e0]">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-4 p-4 transition-colors hover:bg-[#faf9f6] sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                      t.type === "subscription"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {t.type === "subscription" ? (
                      <DollarSign className="size-5" />
                    ) : (
                      <Receipt className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-foreground">
                        {t.title}
                      </h2>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          t.type === "subscription"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {t.type}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          t.status === "accepted" || t.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Client/Vendor: <strong className="text-foreground">{t.customer}</strong></span>
                      <span>• Date: {new Date(t.date).toLocaleDateString()}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">ID: {t.id.slice(-8)}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <p className="font-heading text-lg font-bold text-foreground">
                    {t.currency === "USD" ? `$${t.amount}` : `৳${t.amount.toLocaleString("en-BD")}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.status === "accepted" || t.status === "active" ? "Confirmed" : "In Review"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
