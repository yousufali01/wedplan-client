"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "cn";

/**
 * Vector recreation of the WedPlan "WP" monogram: a deep‑green serif W,
 * a gold serif P slightly offset to the right, a gold + green leaf sprout
 * rising from the P stem and a green swash flowing underneath. Glyphs use
 * the Playfair Display font variable (loaded in the root layout) so the
 * mark always matches the word‑mark; colors come from the theme tokens so
 * the monogram adapts to light/dark mode automatically.
 */
export function Monogram({ className }: { className?: string }) {
  const font = "var(--font-playfair), 'Playfair Display', serif";
  return (
    <svg
      viewBox="0 0 52 46"
      fill="none"
      role="presentation"
      className={cn("h-7 w-auto", className)}
    >
      {/* green swash flowing under the letters */}
      <path
        d="M13 38c7 5 16 6 23 2.5"
        stroke="var(--primary)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* gold leaf sprout on the P stem */}
      <path d="M31 15c1-6 5-10 10-10-1 6-4 9-10 10Z" fill="var(--gold)" />
      {/* small green leaf */}
      <path d="M37 13c3-2.5 6.5-2.5 8.5-.5-2 3-5.5 3.2-8.5.5Z" fill="var(--primary)" />
      {/* W — deep green */}
      <text
        x="1"
        y="34"
        fontSize="32"
        fontWeight="600"
        fill="var(--primary)"
        style={{ fontFamily: font }}
      >
        W
      </text>
      {/* P — gold, baseline slightly lower like the brand mark */}
      <text
        x="26"
        y="38"
        fontSize="32"
        fontWeight="600"
        fill="var(--gold)"
        style={{ fontFamily: font }}
      >
        P
      </text>
    </svg>
  );
}

/**
 * Clickable logo that navigates to the home page.
 * Implemented as a client component using `useRouter` to avoid any
 * server‑client mismatch and to guarantee a client‑side navigation.
 */
export function Logo({ className }: { className?: string }) {
  const router = useRouter();
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/");
  };
  return (
    <div
      role="button"
      aria-label={`${siteConfig.name} — home`}
      onClick={handleClick}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {/* Ivory badge echoing the monogram's warm backdrop */}
      <span className="grid size-9 place-items-center rounded-xl border border-border bg-secondary px-1">
        <Monogram className="h-6" />
      </span>
      <span className="font-heading text-xl font-semibold tracking-tight">
        <span className="text-primary">Wed</span>
        <span className="text-gold">Plan</span>
      </span>
    </div>
  );
}
