"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CircleDollarSign,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  PiggyBank,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

/* ─── Types ─── */
type BudgetItem = {
  id: string;
  category: string;
  estimated: number;
  actual: number;
};

const DEFAULT_CATEGORIES = [
  "Venue",
  "Catering & Food",
  "Photography & Video",
  "Decoration & Florals",
  "Makeup & Styling",
  "Wedding Fashion",
  "Music & Entertainment",
  "Transportation",
  "Invitations & Stationery",
  "Honeymoon",
  "Miscellaneous",
];

const STORAGE_KEY = "wedplan.budget";

/* ─── Helpers ─── */
function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

function loadFromStorage(): { totalBudget: number; items: BudgetItem[] } {
  if (typeof window === "undefined")
    return { totalBudget: 500000, items: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { totalBudget: number; items: BudgetItem[] };
  } catch {}
  return { totalBudget: 500000, items: [] };
}

function saveToStorage(data: { totalBudget: number; items: BudgetItem[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/* ─── Progress bar ─── */
function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE7DE]">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─── Inline editable row ─── */
function BudgetRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: BudgetItem;
  onUpdate: (id: string, fields: Partial<BudgetItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item);

  const diff = item.actual - item.estimated;

  function save() {
    onUpdate(item.id, {
      category: draft.category.trim() || item.category,
      estimated: Number(draft.estimated) || 0,
      actual: Number(draft.actual) || 0,
    });
    setEditing(false);
  }

  function discard() {
    setDraft(item);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="bg-primary/5">
        <td className="px-4 py-3">
          <input
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            min="0"
            value={draft.estimated}
            onChange={(e) =>
              setDraft((d) => ({ ...d, estimated: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            min="0"
            value={draft.actual}
            onChange={(e) =>
              setDraft((d) => ({ ...d, actual: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={save}
              className="grid size-7 place-items-center rounded-lg bg-primary text-white hover:bg-primary/80"
            >
              <Check className="size-3.5" />
            </button>
            <button
              onClick={discard}
              className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[#EDE7DE] hover:bg-[#FAF8F5] transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-[#183D2D]">
        {item.category}
      </td>
      <td className="px-4 py-3 text-sm">{fmt(item.estimated)}</td>
      <td className="px-4 py-3 text-sm">{fmt(item.actual)}</td>
      <td
        className={`px-4 py-3 text-sm font-semibold ${
          diff > 0
            ? "text-red-600"
            : diff < 0
              ? "text-emerald-600"
              : "text-muted-foreground"
        }`}
      >
        {diff > 0 ? `+${fmt(diff)}` : diff < 0 ? `-${fmt(Math.abs(diff))}` : "On budget"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setDraft(item);
              setEditing(true);
            }}
            className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="grid size-7 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Main Page ─── */
export default function BudgetPage() {
  const [hydrated, setHydrated] = React.useState(false);
  const [totalBudget, setTotalBudget] = React.useState(500000);
  const [items, setItems] = React.useState<BudgetItem[]>([]);
  const [editingTotal, setEditingTotal] = React.useState(false);
  const [draftTotal, setDraftTotal] = React.useState("500000");

  /* Adding new item */
  const [newCategory, setNewCategory] = React.useState("Venue");
  const [newEstimated, setNewEstimated] = React.useState("");
  const [newActual, setNewActual] = React.useState("");
  const [showAddRow, setShowAddRow] = React.useState(false);

  /* ─── Server sync ───
   * The budget lives in MongoDB (one document per user) so it follows the
   * account to any device. localStorage stays as the offline/first-paint
   * fallback and is also used to migrate older local-only data.
   */
  const [syncState, setSyncState] = React.useState<
    "loading" | "saving" | "saved" | "local"
  >("loading");

  const saveTimer = React.useRef<number | null>(null);
  const serverErrorShown = React.useRef(false);
  const latestRef = React.useRef<{ totalBudget: number; items: BudgetItem[] } | null>(
    null,
  );

  const persistToServer = React.useCallback(async (data: {
    totalBudget: number;
    items: BudgetItem[];
  }) => {
    try {
      setSyncState("saving");
      await apiRequest("/api/v1/planner/budget", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setSyncState("saved");
      serverErrorShown.current = false;
    } catch (error) {
      // Not signed in, offline, or a network hiccup — keep working locally.
      setSyncState("local");
      if (!serverErrorShown.current) {
        serverErrorShown.current = true;
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't save your budget to your account.",
          { description: "Your changes are stored on this device for now." },
        );
      }
    }
  }, []);

  /** Debounced save: localStorage immediately, MongoDB shortly after. */
  const persist = React.useCallback(
    (data: { totalBudget: number; items: BudgetItem[] }) => {
      latestRef.current = data;
      saveToStorage(data);

      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = null;
        void persistToServer(data);
      }, 500);
    },
    [persistToServer],
  );

  /* Flush any pending save when the user navigates away. */
  React.useEffect(
    () => () => {
      if (saveTimer.current !== null && latestRef.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
        void persistToServer(latestRef.current);
      }
    },
    [persistToServer],
  );

  /* Load: server first, localStorage as fallback / migration source. */
  React.useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      const local = loadFromStorage();
      let next = local;
      let source: "server" | "local" = "local";

      try {
        const data = await apiRequest<{
          budget: { totalBudget: number; items: BudgetItem[] } | null;
        }>("/api/v1/planner/budget");

        const server = data.budget;
        const serverItems = Array.isArray(server?.items) ? server.items : [];

        if (serverItems.length > 0) {
          next = {
            totalBudget: Number(server?.totalBudget) || local.totalBudget,
            items: serverItems,
          };
          source = "server";
        } else if (local.items.length > 0 || local.totalBudget !== 500000) {
          // First sign-in with older device-only data → push it to MongoDB.
          void persistToServer(local);
          source = "local";
        } else {
          source = "server";
          next = {
            totalBudget: Number(server?.totalBudget) || local.totalBudget,
            items: [],
          };
        }
      } catch {
        source = "local";
      }

      if (cancelled) return;

      setTotalBudget(next.totalBudget);
      setDraftTotal(String(next.totalBudget));
      setItems(next.items);
      setSyncState(source === "server" ? "saved" : "local");
      setHydrated(true);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [persistToServer]);

  /* Persist on change (debounced) */
  React.useEffect(() => {
    if (!hydrated) return;
    persist({ totalBudget, items });
  }, [hydrated, totalBudget, items, persist]);

  /* Derived sums */
  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const remaining = totalBudget - totalActual;
  const overBudget = remaining < 0;

  function handleAddItem() {
    if (!newCategory.trim() || !newEstimated) return;
    setItems((prev) => [
      ...prev,
      {
        id: newId(),
        category: newCategory.trim(),
        estimated: Number(newEstimated) || 0,
        actual: Number(newActual) || 0,
      },
    ]);
    setNewEstimated("");
    setNewActual("");
    setNewCategory("Venue");
    setShowAddRow(false);
  }

  function handleUpdate(id: string, fields: Partial<BudgetItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fields } : item))
    );
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function saveTotalBudget() {
    const val = Number(draftTotal);
    if (!Number.isNaN(val) && val >= 0) setTotalBudget(val);
    setEditingTotal(false);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <CircleDollarSign className="size-7 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {/* ─── Header ─── */}
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Budget tracker
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Wedding Budget
        </h1>
        <p className="max-w-lg text-balance text-muted-foreground">
          Plan your total budget, add spending categories, and track estimated
          vs actual costs — saved automatically to your WedPlan account.
        </p>
      </header>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Budget */}
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1 rounded-2xl border border-[#D8CBAA] bg-[#183D2D] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D5B66D]">
              Total Budget
            </span>
            <button
              onClick={() => {
                setDraftTotal(String(totalBudget));
                setEditingTotal(true);
              }}
              className="rounded-md p-1 text-[#D5B66D] hover:bg-white/10"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
          {editingTotal ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                autoFocus
                type="number"
                min="0"
                value={draftTotal}
                onChange={(e) => setDraftTotal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTotalBudget();
                  if (e.key === "Escape") setEditingTotal(false);
                }}
                className="w-full rounded-lg border border-[#D5B66D]/50 bg-white/10 px-2 py-1 text-sm text-white outline-none"
              />
              <button
                onClick={saveTotalBudget}
                className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#D5B66D] text-[#183D2D]"
              >
                <Check className="size-3.5" />
              </button>
            </div>
          ) : (
            <p className="font-heading text-2xl font-bold">{fmt(totalBudget)}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-[#EDE7DE] bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estimated
          </span>
          <p className="font-heading text-2xl font-bold text-[#183D2D]">
            {fmt(totalEstimated)}
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-[#EDE7DE] bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Spent (Actual)
          </span>
          <p className="font-heading text-2xl font-bold text-[#183D2D]">
            {fmt(totalActual)}
          </p>
        </div>

        <div
          className={`flex flex-col gap-1 rounded-2xl border p-5 shadow-sm ${
            overBudget
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              overBudget ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {overBudget ? "Over Budget" : "Remaining"}
          </span>
          <p
            className={`font-heading text-2xl font-bold ${
              overBudget ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {overBudget ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}
          </p>
        </div>
      </div>

      {/* ─── Spend progress bar ─── */}
      <div className="rounded-2xl border border-[#EDE7DE] bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-medium text-[#183D2D]">
            <TrendingUp className="size-4 text-primary" />
            Budget used
          </div>
          <span
            className={`text-xs font-semibold ${
              overBudget ? "text-red-600" : "text-[#183D2D]"
            }`}
          >
            {totalBudget > 0
              ? `${Math.round((totalActual / totalBudget) * 100)}%`
              : "0%"}
          </span>
        </div>
        <ProgressBar
          value={totalActual}
          max={totalBudget}
          color={overBudget ? "bg-red-500" : "bg-primary"}
        />
        {overBudget && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="size-3.5" />
            You have exceeded your total wedding budget.
          </div>
        )}
      </div>

      {/* ─── Budget Table ─── */}
      <div className="rounded-2xl border border-[#EDE7DE] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE7DE]">
          <div className="flex items-center gap-2">
            <PiggyBank className="size-4 text-primary" />
            <h2 className="font-heading text-lg font-semibold text-[#183D2D]">
              Budget Breakdown
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {items.length} categories
            </span>
          </div>
          <button
            onClick={() => setShowAddRow(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/80 transition"
          >
            <Plus className="size-3.5" />
            Add Category
          </button>
        </div>

        {items.length === 0 && !showAddRow ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CircleDollarSign className="size-7" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold text-[#183D2D]">
                No budget items yet
              </p>
              <p className="text-sm text-muted-foreground">
                Add your first spending category to start tracking.
              </p>
            </div>
            <button
              onClick={() => setShowAddRow(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition"
            >
              <Plus className="size-4" />
              Add Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[#183D2D]">
              <thead>
                <tr className="bg-[#FAF8F5]">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimated
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actual
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Variance
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <BudgetRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}

                {/* Add new item row */}
                {showAddRow && (
                  <tr className="border-t border-[#EDE7DE] bg-primary/5">
                    <td className="px-4 py-3">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                      >
                        {DEFAULT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Custom">Custom…</option>
                      </select>
                      {newCategory === "Custom" && (
                        <input
                          autoFocus
                          placeholder="Category name"
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newEstimated}
                        onChange={(e) => setNewEstimated(e.target.value)}
                        className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newActual}
                        onChange={(e) => setNewActual(e.target.value)}
                        className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleAddItem}
                          disabled={!newEstimated}
                          className="grid size-7 place-items-center rounded-lg bg-primary text-white hover:bg-primary/80 disabled:opacity-50"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setShowAddRow(false)}
                          className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Totals row */}
                {items.length > 0 && (
                  <tr className="border-t-2 border-[#D5B66D] bg-[#FAF8F5] font-semibold">
                    <td className="px-4 py-3 text-sm text-[#183D2D]">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm">{fmt(totalEstimated)}</td>
                    <td className="px-4 py-3 text-sm">{fmt(totalActual)}</td>
                    <td
                      className={`px-4 py-3 text-sm font-bold ${
                        totalActual > totalEstimated
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {totalActual > totalEstimated
                        ? `+${fmt(totalActual - totalEstimated)}`
                        : `-${fmt(totalEstimated - totalActual)}`}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {syncState === "saving" ? (
          <>
            <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
            Saving to your WedPlan account…
          </>
        ) : syncState === "saved" ? (
          <>
            <Check className="size-3.5 text-emerald-600" strokeWidth={3} />
            All changes saved to your account
          </>
        ) : syncState === "loading" ? (
          "Loading your budget…"
        ) : (
          <>
            <span className="size-1.5 rounded-full bg-amber-500" />
            Offline — changes are stored on this device and will sync later.
          </>
        )}
      </p>
    </section>
  );
}
