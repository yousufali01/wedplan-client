"use client";

import * as React from "react";
import {
  Ban,
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "customer" | "vendor" | "admin";
  vendorApproved?: boolean;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: string | number | null;
  createdAt?: string;
};

function subscribeToNow(onStoreChange: () => void) {
  const interval = window.setInterval(onStoreChange, 10_000);
  return () => window.clearInterval(interval);
}

function getNowSnapshot() {
  return Date.now();
}

function getNowServerSnapshot() {
  return 0;
}

export default function AdminUsersPage() {
  const now = React.useSyncExternalStore(
    subscribeToNow,
    getNowSnapshot,
    getNowServerSnapshot
  );
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  // Dialog state for block confirmation
  const [pendingBlockUser, setPendingBlockUser] = React.useState<UserRecord | null>(null);
  const [blockReason, setBlockReason] = React.useState<string>("");

  // Dialog state for unblock confirmation
  const [pendingUnblockUser, setPendingUnblockUser] = React.useState<UserRecord | null>(null);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ users: UserRecord[]; total: number }>(
        "/api/v1/admin/users?limit=100"
      );
      if (res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      toast.error("Failed to fetch users", {
        description: err instanceof Error ? err.message : "Please check server connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: "customer" | "vendor" | "admin") => {
    setActionInProgress(userId);
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });

      toast.success(`User role changed to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error("Failed to update role", {
        description: err instanceof Error ? err.message : "Action denied.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleVendorApproval = async (userId: string, approved: boolean) => {
    setActionInProgress(userId);
    try {
      await apiRequest(`/api/v1/admin/vendors/${userId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });

      toast.success(
        approved ? "Vendor approved successfully!" : "Vendor application rejected."
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, vendorApproved: approved } : u))
      );
    } catch (err) {
      toast.error("Approval action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmBlock = async () => {
    if (!pendingBlockUser) return;
    const targetId = pendingBlockUser.id;
    setActionInProgress(targetId);

    try {
      await apiRequest(`/api/v1/admin/users/${targetId}/ban`, {
        method: "POST",
        body: JSON.stringify({
          reason: blockReason.trim() || "Account blocked by administrator.",
        }),
      });

      toast.success(`User "${pendingBlockUser.name}" has been blocked.`);
      setPendingBlockUser(null);
      setBlockReason("");
      await fetchUsers();
    } catch (err) {
      toast.error("Failed to block user", {
        description: err instanceof Error ? err.message : "Action could not be completed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmUnblock = async () => {
    if (!pendingUnblockUser) return;
    const targetId = pendingUnblockUser.id;
    setActionInProgress(targetId);

    try {
      await apiRequest(`/api/v1/admin/users/${targetId}/unban`, {
        method: "POST",
      });

      toast.success(`User "${pendingUnblockUser.name}" has been unblocked.`);
      setPendingUnblockUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error("Failed to unblock user", {
        description: err instanceof Error ? err.message : "Action could not be completed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const isUserEffectivelyBlocked = React.useCallback((u: UserRecord) => {
    if (!u.banned) return false;
    if (!u.banExpires) return true;
    const exp = new Date(u.banExpires).getTime();
    if (Number.isNaN(exp)) return true;
    return exp > (now ?? 0);
  }, [now]);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const isBlocked = isUserEffectivelyBlocked(u);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "blocked" && isBlocked) ||
        (statusFilter === "active" && !isBlocked);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, roleFilter, statusFilter, searchQuery, isUserEffectivelyBlocked]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              User Management
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              {users.length} Total Registered
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Manage System Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Promote or demote user roles, approve verified vendor onboarding, and enforce platform security with account block/unblock controls.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchUsers()}
          disabled={isLoading}
          className="gap-2 border-[#e9e1d8] bg-white w-fit cursor-pointer"
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
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e6dfd5] bg-transparent py-2 pl-9 pr-3 text-xs outline-none focus:border-primary sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#e6dfd5] bg-white px-3 py-2 text-xs font-medium outline-none cursor-pointer focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-[#e6dfd5] bg-white px-3 py-2 text-xs font-medium outline-none cursor-pointer focus:border-primary"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="customer">Customers</option>
              <option value="vendor">Vendors</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="overflow-hidden rounded-2xl border border-[#e9e1d8] bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading platform users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center">
            <Users className="size-10 text-muted-foreground" />
            <h3 className="mt-3 font-heading text-lg font-semibold">No Users Found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              No registered user matches your current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eee8e0]">
            {filteredUsers.map((u) => {
              const isWorking = actionInProgress === u.id;
              const isBlocked = isUserEffectivelyBlocked(u);
              const isSelf = currentAdmin?.id === u.id;

              return (
                <div
                  key={u.id}
                  className={`flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                    isBlocked ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-[#faf9f6]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar size="default" className={isBlocked ? "ring-2 ring-red-300" : ""}>
                      {u.image && <AvatarImage src={u.image} alt={u.name} />}
                      <AvatarFallback
                        className={`font-semibold ${
                          isBlocked ? "bg-red-100 text-red-700" : "text-primary"
                        }`}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {u.name}
                        </p>

                        {isSelf && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            You
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : u.role === "vendor"
                                ? "bg-primary/10 text-primary"
                                : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {u.role}
                        </span>

                        {u.role === "vendor" && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              u.vendorApproved
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {u.vendorApproved ? "Approved Partner" : "Pending Approval"}
                          </span>
                        )}

                        {/* Status badge: Active or Blocked */}
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                            <ShieldAlert className="size-3" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <ShieldCheck className="size-3" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                        {isBlocked && u.banReason && (
                          <span className="text-[11px] text-red-600 font-medium">
                            • Reason: {u.banReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {/* Vendor Approval toggles */}
                    {u.role === "vendor" && (
                      u.vendorApproved ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleVendorApproval(u.id, false)}
                          className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 cursor-pointer"
                        >
                          Revoke Approval
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleVendorApproval(u.id, true)}
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve Vendor
                        </Button>
                      )
                    )}

                    {/* Role changer dropdown */}
                    <div className="flex items-center gap-1.5">
                      <select
                        disabled={isWorking || u.role === "admin" || isSelf}
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            e.target.value as "customer" | "vendor" | "admin"
                          )
                        }
                        className="rounded-lg border border-[#e6dfd5] bg-white px-2.5 py-1 text-xs font-semibold text-foreground outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Block / Unblock Action Button */}
                    {isBlocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isWorking || isSelf}
                        onClick={() => setPendingUnblockUser(u)}
                        className="h-8 text-xs font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 gap-1 cursor-pointer"
                      >
                        {isWorking ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <UserCheck className="size-3.5" />
                        )}
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isWorking || isSelf}
                        onClick={() => {
                          setPendingBlockUser(u);
                          setBlockReason("");
                        }}
                        className="h-8 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1 cursor-pointer disabled:opacity-40"
                        title={isSelf ? "You cannot block your own account" : "Block User"}
                      >
                        {isWorking ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Ban className="size-3.5" />
                        )}
                        Block
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Confirmation Dialog */}
      <AlertDialog
        open={Boolean(pendingBlockUser)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingBlockUser(null);
            setBlockReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="size-5" />
              <AlertDialogTitle>Block User Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to block <strong>{pendingBlockUser?.name}</strong> ({pendingBlockUser?.email})?
              While blocked, they will be immediately prevented from accessing any protected platform features or APIs.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Reason for blocking (optional):
            </label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Terms of Service violation, suspicious activity..."
              className="w-full rounded-lg border border-[#e6dfd5] bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(actionInProgress)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmBlock();
              }}
              disabled={Boolean(actionInProgress)}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5 cursor-pointer"
            >
              {actionInProgress === pendingBlockUser?.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Ban className="size-3.5" />
              )}
              Confirm Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog
        open={Boolean(pendingUnblockUser)}
        onOpenChange={(open) => {
          if (!open) setPendingUnblockUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-emerald-700">
              <KeyRound className="size-5" />
              <AlertDialogTitle>Unblock User Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to restore access for <strong>{pendingUnblockUser?.name}</strong> ({pendingUnblockUser?.email})?
              Once unblocked, they will regain access to their account and protected services immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(actionInProgress)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmUnblock();
              }}
              disabled={Boolean(actionInProgress)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 cursor-pointer"
            >
              {actionInProgress === pendingUnblockUser?.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserCheck className="size-3.5" />
              )}
              Confirm Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
