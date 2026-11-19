"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "cn";
import { siteConfig } from "@/config/site";

export default function PaymentSuccessPage() {
  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center bg-success/5 p-8")}>
      <Check className="size-24 text-success" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-bold text-success">
        Payment Successful!
      </h1>
      <p className="mt-4 text-center text-muted-foreground">
        Thank you for your purchase. Your subscription has been activated.
      </p>
      <Link
        href="/"
        className={cn(
          "mt-8 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        )}
      >
        Return to Home
      </Link>
    </div>
  );
}
