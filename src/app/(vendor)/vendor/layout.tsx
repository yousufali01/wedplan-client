import type { ReactNode } from "react";

import { VendorShell } from "@/components/layout/vendor-shell";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
