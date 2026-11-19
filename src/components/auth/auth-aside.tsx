import { CalendarCheck, ListChecks, Store, Wallet } from "lucide-react";

import { Monogram } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";

const highlights = [
  {
    icon: Store,
    title: "For vendors",
    text: "put your services in front of couples actively planning.",
  },
  {
    icon: Wallet,
    title: "Budget tools",
    text: "track every expense against your plan, category by category.",
  },
  {
    icon: CalendarCheck,
    title: "Bookings",
    text: "manage quotes, confirmations and payments in one place.",
  },
  {
    icon: ListChecks,
    title: "Checklist",
    text: "keep every task on schedule from engagement to aisle.",
  },
] as const;

/**
 * Desktop-only brand panel shared by the auth pages (Sign Up / Sign In):
 * monogram, headline, description, gold-chip highlight list and the
 * brand tagline. Hidden below the `lg` breakpoint.
 */
export function AuthAside({
  headline,
  description,
}: {
  headline: string;
  description: string;
}) {
  return (
    <div className="hidden flex-col gap-8 lg:flex">
      <Monogram className="h-14" />

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-4xl font-semibold tracking-tight text-balance">
          {headline}
        </h2>
        <p className="max-w-md text-balance text-muted-foreground">{description}</p>
      </div>

      <ul className="flex flex-col gap-3.5">
        {highlights.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <p className="text-sm">
              <span className="font-semibold">{title}</span>{" "}
              <span className="text-muted-foreground">— {text}</span>
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-auto font-heading text-lg text-muted-foreground italic">
        “{siteConfig.tagline}”
      </p>
    </div>
  );
}
