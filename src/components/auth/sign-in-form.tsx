"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { AuthAside } from "@/components/auth/auth-aside";
import { Logo, Monogram } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/config/site";

/* ------------------------------------------------------------------ */
/* Validation */
/* ------------------------------------------------------------------ */

const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

/* ------------------------------------------------------------------ */
/* Google Icon */
/* ------------------------------------------------------------------ */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />

      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />

      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />

      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Sign In Form */
/* ------------------------------------------------------------------ */

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || searchParams.get("callbackUrl");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const { data: session, isPending } = authClient.useSession();

  /* Dashboard Redirect */

  const getDashboardPath = React.useCallback((user: { role?: string | null }) => {
    if (user.role === "admin") {
      return siteConfig.dashboards.admin;
    }
    if (user.role === "vendor") {
      return siteConfig.dashboards.vendor;
    }
    return siteConfig.dashboards.customer;
  }, []);

  const getRedirectTarget = React.useCallback(
    (role?: string | null) => {
      if (
        callbackURL &&
        callbackURL.startsWith("/") &&
        !callbackURL.startsWith("//")
      ) {
        return callbackURL;
      }
      return getDashboardPath({ role });
    },
    [callbackURL, getDashboardPath]
  );

  /* If already signed in, redirect to the appropriate dashboard or callbackURL */

  React.useEffect(() => {
    if (isPending || !session?.user) return;
    const userRole = (session.user as { role?: string }).role;
    router.replace(getRedirectTarget(userRole));
  }, [isPending, session, router, getRedirectTarget]);

  /* Google Sign In */

  const handleGoogleSignIn = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectQuery = callbackURL ? `?redirect=${encodeURIComponent(callbackURL)}` : "";
      const socialCallbackURL = `${origin}/auth/callback${redirectQuery}`;

      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: socialCallbackURL,
      });

      if (error) {
        toast.error("Google sign-in failed", {
          description: error.message || "Please try again.",
        });
      }
    } catch (error) {
      toast.error("Google sign-in failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  /* Email and Password Sign In */

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email.trim(),
        password: values.password,
      });

      if (error || !data?.user) {
        toast.error("Could not sign you in", {
          description:
            error?.message ||
            "Please check your email and password.",

          action: {
            label: "Sign Up",
            onClick: () =>
              router.push(
                callbackURL
                  ? `${siteConfig.routes.signUp}?callbackURL=${encodeURIComponent(callbackURL)}`
                  : siteConfig.routes.signUp
              ),
          },
        });

        return;
      }

      const userRole = (data.user as { role?: string }).role;
      const firstName = data.user.name ? data.user.name.split(" ")[0] : "there";

      toast.success(
        `Welcome back, ${firstName}!`,
        {
          description: "You have signed in successfully.",
        }
      );

      router.replace(getRedirectTarget(userRole));
    } catch (error) {
      toast.error("Could not sign you in", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /* UI */
/* ------------------------------------------------------------------ */

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] w-full items-center bg-gradient-to-b from-secondary/60 via-background to-accent/15 py-10">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16">

        {/* Brand Panel */}

        <AuthAside
          headline="Welcome back — your plans are waiting."
          description={`Sign in to ${siteConfig.name} to pick up where you left off: track your budget, tick off your checklist and manage your vendor bookings.`}
        />

        {/* Sign In Card */}

        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">

          <div className="flex flex-col items-center gap-2 text-center">

            <div className="lg:hidden">
              <Logo />
            </div>

            <div className="hidden lg:block">
              <Monogram className="h-10" />
            </div>

            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back
            </h1>

            <p className="text-sm text-muted-foreground">
              Sign in to manage your wedding plans or your vendor account.
            </p>

          </div>

          {/* Google Sign In Button */}

          <div className="mt-6 flex flex-col gap-4">

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>

            <div
              className="flex items-center gap-3"
              aria-hidden="true"
            >
              <span className="h-px flex-1 bg-border" />

              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                or continue with email
              </span>

              <span className="h-px flex-1 bg-border" />
            </div>

          </div>

          {/* Email Sign In Form */}

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-6 flex flex-col gap-5"
          >

            {/* Email */}

            <div className="flex flex-col gap-1.5">

              <Label htmlFor="email">
                Email address
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />

              {errors.email && (
                <p
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}

            </div>

            {/* Password */}

            <div className="flex flex-col gap-1.5">

              <Label htmlFor="password">
                Password
              </Label>

              <div className="relative">

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="h-10 pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((visible) => !visible)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {showPassword ? (
                    <EyeOff
                      className="size-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <Eye
                      className="size-4"
                      aria-hidden="true"
                    />
                  )}
                </button>

              </div>

              {errors.password && (
                <p
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}

            </div>

            {/* Submit Button */}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Signing you in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>

          </form>

          {/* Sign Up Link */}

          <p className="mt-5 border-t border-border pt-5 text-center text-sm text-muted-foreground">

            New to {siteConfig.name}?{" "}

            <Link
              href={
                callbackURL
                  ? `${siteConfig.routes.signUp}?callbackURL=${encodeURIComponent(callbackURL)}`
                  : siteConfig.routes.signUp
              }
              className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Create an account
            </Link>

          </p>

        </div>
      </div>
    </section>
  );
}