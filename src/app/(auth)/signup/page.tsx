import * as React from "react";
import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignUpForm />
    </React.Suspense>
  );
}

