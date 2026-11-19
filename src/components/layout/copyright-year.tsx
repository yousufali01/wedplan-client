"use client";

import * as React from "react";

/**
 * The current year, resolved on the client after hydration.
 *
 * Next.js `cacheComponents` forbids `new Date()` inside prerendered
 * render passes, and the react-hooks lint rules reject set-state-in-effect,
 * so this uses `useSyncExternalStore`: the server/hydration snapshot is
 * `null` (deterministic), and the client snapshot — evaluated only in the
 * browser — is the current year.
 */
function subscribeToYear(onStoreChange: () => void) {
  // Re-check once a minute so a year rollover (Dec 31 → Jan 1) is picked
  // up without any user interaction.
  const interval = window.setInterval(onStoreChange, 60_000);

  return () => window.clearInterval(interval);
}

function getYearSnapshot() {
  return new Date().getFullYear();
}

function getYearServerSnapshot() {
  return null;
}

export function CopyrightYear() {
  const year = React.useSyncExternalStore(
    subscribeToYear,
    getYearSnapshot,
    getYearServerSnapshot
  );

  return <>{year ?? ""}</>;
}
