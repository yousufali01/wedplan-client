"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ListChecks,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

/* ─── Types ─── */
type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type ChecklistGroup = {
  id: string;
  title: string;
  timeline: string;
  items: ChecklistItem[];
};

/* ─── Default wedding checklist data ─── */
const DEFAULT_GROUPS: ChecklistGroup[] = [
  {
    id: "12m",
    title: "12+ Months Before",
    timeline: "Early Planning",
    items: [
      { id: "12-1", label: "Set your overall wedding budget", done: false },
      { id: "12-2", label: "Decide on wedding date & season", done: false },
      { id: "12-3", label: "Create your initial guest list", done: false },
      { id: "12-4", label: "Research and book the wedding venue", done: false },
      { id: "12-5", label: "Hire a wedding planner / coordinator", done: false },
      { id: "12-6", label: "Start researching photographers & videographers", done: false },
    ],
  },
  {
    id: "9m",
    title: "9–12 Months Before",
    timeline: "Vendor Booking",
    items: [
      { id: "9-1", label: "Book photographer & videographer", done: false },
      { id: "9-2", label: "Book catering / food vendor", done: false },
      { id: "9-3", label: "Book florist / decoration vendor", done: false },
      { id: "9-4", label: "Book music / DJ / entertainment", done: false },
      { id: "9-5", label: "Start dress / sherwani shopping", done: false },
      { id: "9-6", label: "Book hair & makeup artist", done: false },
      { id: "9-7", label: "Plan honeymoon destination", done: false },
    ],
  },
  {
    id: "6m",
    title: "6–9 Months Before",
    timeline: "Details",
    items: [
      { id: "6-1", label: "Send save-the-date cards", done: false },
      { id: "6-2", label: "Finalise guest list & seating plan", done: false },
      { id: "6-3", label: "Order wedding invitations", done: false },
      { id: "6-4", label: "Register for wedding gifts", done: false },
      { id: "6-5", label: "Book accommodation for out-of-town guests", done: false },
      { id: "6-6", label: "Plan wedding ceremony program", done: false },
      { id: "6-7", label: "Start wedding cake tasting", done: false },
    ],
  },
  {
    id: "3m",
    title: "3–6 Months Before",
    timeline: "Final Preparations",
    items: [
      { id: "3-1", label: "Send wedding invitations", done: false },
      { id: "3-2", label: "Arrange transportation for wedding day", done: false },
      { id: "3-3", label: "Purchase wedding rings / jewellery", done: false },
      { id: "3-4", label: "Confirm all vendor bookings", done: false },
      { id: "3-5", label: "Finalise wedding menu with caterer", done: false },
      { id: "3-6", label: "Plan rehearsal dinner", done: false },
      { id: "3-7", label: "Arrange officiant / kazee / priest", done: false },
    ],
  },
  {
    id: "1m",
    title: "1–3 Months Before",
    timeline: "Almost There",
    items: [
      { id: "1-1", label: "Collect RSVPs and finalise headcount", done: false },
      { id: "1-2", label: "Have final dress / sherwani fitting", done: false },
      { id: "1-3", label: "Prepare wedding day timeline / schedule", done: false },
      { id: "1-4", label: "Create vendor contact list for the day", done: false },
      { id: "1-5", label: "Prepare final payments for vendors", done: false },
      { id: "1-6", label: "Pack for honeymoon", done: false },
    ],
  },
  {
    id: "1w",
    title: "1 Week Before",
    timeline: "Final Week",
    items: [
      { id: "1w-1", label: "Confirm headcount with caterer", done: false },
      { id: "1w-2", label: "Distribute ceremony programs", done: false },
      { id: "1w-3", label: "Assign roles to wedding party members", done: false },
      { id: "1w-4", label: "Do a full venue walk-through", done: false },
      { id: "1w-5", label: "Prepare emergency kit (pins, tape, pain relief)", done: false },
      { id: "1w-6", label: "Get a good night's sleep & relax!", done: false },
    ],
  },
];

const STORAGE_KEY = "wedplan.checklist";

function loadChecklist(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveChecklist(done: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  } catch {}
}

/* ─── Group Section ─── */
function GroupSection({
  group,
  doneMap,
  onToggle,
}: {
  group: ChecklistGroup;
  doneMap: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);

  const completedCount = group.items.filter((i) => doneMap[i.id]).length;
  const total = group.items.length;
  const allDone = completedCount === total;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-[#EDE7DE] bg-white shadow-sm overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#FAF8F5] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <div>
            <p className="font-heading font-semibold text-[#183D2D]">
              {group.title}
            </p>
            <p className="text-xs text-muted-foreground">{group.timeline}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Mini progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EDE7DE]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allDone ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              allDone
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            {completedCount}/{total}
          </span>
        </div>
      </button>

      {/* Items */}
      {open && (
        <ul className="border-t border-[#EDE7DE] divide-y divide-[#EDE7DE]">
          {group.items.map((item) => {
            const done = Boolean(doneMap[item.id]);
            return (
              <li key={item.id}>
                <button
                  onClick={() => onToggle(item.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#FAF8F5] ${
                    done ? "opacity-60" : ""
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-[#D5B66D]" />
                  )}
                  <span
                    className={`text-sm ${
                      done
                        ? "line-through text-muted-foreground"
                        : "text-[#183D2D]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ChecklistPage() {
  const [hydrated, setHydrated] = React.useState(false);
  const [doneMap, setDoneMap] = React.useState<Record<string, boolean>>({});
  const [syncState, setSyncState] = React.useState<
    "loading" | "saving" | "saved" | "local"
  >("loading");

  const saveTimer = React.useRef<number | null>(null);
  const serverErrorShown = React.useRef(false);
  const latestRef = React.useRef<Record<string, boolean> | null>(null);

  const persistToServer = React.useCallback(
    async (done: Record<string, boolean>) => {
      try {
        setSyncState("saving");
        await apiRequest("/api/v1/planner/checklist", {
          method: "PUT",
          body: JSON.stringify(done),
        });
        setSyncState("saved");
        serverErrorShown.current = false;
      } catch (error) {
        setSyncState("local");
        if (!serverErrorShown.current) {
          serverErrorShown.current = true;
          toast.error(
            error instanceof Error
              ? error.message
              : "Couldn't save your checklist to your account.",
            { description: "Progress is stored on this device for now." },
          );
        }
      }
    },
    [],
  );

  /** Debounced save: localStorage immediately, MongoDB shortly after. */
  const persist = React.useCallback(
    (done: Record<string, boolean>) => {
      latestRef.current = done;
      saveChecklist(done);

      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = null;
        void persistToServer(done);
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
      const local = loadChecklist();
      let next = local;
      let source: "server" | "local" = "local";

      try {
        const data = await apiRequest<{
          checklist: Record<string, boolean> | null;
        }>("/api/v1/planner/checklist");

        const server = data.checklist;
        const serverKeys = server ? Object.keys(server) : [];

        if (server && serverKeys.length > 0) {
          next = server;
          source = "server";
        } else if (Object.keys(local).length > 0) {
          // First sign-in with older device-only progress → push it to MongoDB.
          void persistToServer(local);
          source = "local";
        } else {
          next = {};
          source = "server";
        }
      } catch {
        source = "local";
      }

      if (cancelled) return;

      setDoneMap(next);
      setSyncState(source === "server" ? "saved" : "local");
      setHydrated(true);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [persistToServer]);

  const handleToggle = React.useCallback(
    (id: string) => {
      setDoneMap((prev) => {
        const updated = { ...prev, [id]: !prev[id] };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  /* Overall progress */
  const allItems = DEFAULT_GROUPS.flatMap((g) => g.items);
  const totalItems = allItems.length;
  const doneCount = hydrated
    ? allItems.filter((i) => doneMap[i.id]).length
    : 0;
  const overallPct =
    totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ListChecks className="size-7 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {/* ─── Header ─── */}
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Wedding planner
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Wedding Checklist
        </h1>
        <p className="max-w-lg text-balance text-muted-foreground">
          A complete month-by-month checklist to keep your wedding planning
          on track. Tick off tasks as you complete them — progress syncs to
          your WedPlan account automatically.
        </p>
      </header>

      {/* ─── Overall progress card ─── */}
      <div className="rounded-2xl border border-[#D8CBAA] bg-[#183D2D] p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D5B66D]">
              Overall Progress
            </p>
            <p className="mt-1 font-heading text-3xl font-bold">
              {doneCount}
              <span className="text-lg font-normal text-white/60">
                /{totalItems} tasks
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-4xl font-bold text-[#D5B66D]">
              {overallPct}%
            </p>
            <p className="text-xs text-white/60">complete</p>
          </div>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[#D5B66D] transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {doneCount === totalItems && (
          <p className="mt-3 text-center text-sm font-semibold text-[#D5B66D]">
            🎉 Congratulations! All tasks complete — enjoy your big day!
          </p>
        )}
      </div>

      {/* ─── Group Stats strip ─── */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_GROUPS.map((group) => {
          const done = group.items.filter((i) => doneMap[i.id]).length;
          const total = group.items.length;
          const allDone = done === total;
          return (
            <div
              key={group.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                allDone
                  ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                  : done > 0
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
              }`}
            >
              {allDone ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
              {group.title.split(" ")[0]}{" "}
              <span className="opacity-70">
                {done}/{total}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Checklist groups ─── */}
      <div className="flex flex-col gap-4">
        {DEFAULT_GROUPS.map((group) => (
          <GroupSection
            key={group.id}
            group={group}
            doneMap={doneMap}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {syncState === "saving" ? (
          <>
            <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
            Saving to your WedPlan account…
          </>
        ) : syncState === "saved" ? (
          <>
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Checklist progress saved to your account
          </>
        ) : syncState === "loading" ? (
          "Loading your checklist…"
        ) : (
          <>
            <span className="size-1.5 rounded-full bg-amber-500" />
            Offline — progress is stored on this device and will sync later.
          </>
        )}
      </p>
    </section>
  );
}
