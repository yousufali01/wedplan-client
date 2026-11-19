"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import {
  CircleCheck,
  Eye,
  EyeOff,
  HeartHandshake,
  ImagePlus,
  Loader2,
  Store,
  X,
} from "lucide-react";

import { Logo, Monogram } from "@/components/layout/logo";
import { AuthAside } from "@/components/auth/auth-aside";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Validation */
/* ------------------------------------------------------------------ */

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),

  email: z.email("Please enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[a-z]/, "Include at least one lowercase letter."),

  role: z.enum(["customer", "vendor"], {
    message: "Please choose an account type.",
  }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

/* ------------------------------------------------------------------ */
/* Password Rules */
/* ------------------------------------------------------------------ */

const passwordRules = [
  {
    label: "8+ characters",
    met: (value: string) => value.length >= 8,
  },
  {
    label: "Uppercase",
    met: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "Lowercase",
    met: (value: string) => /[a-z]/.test(value),
  },
] as const;

/* ------------------------------------------------------------------ */
/* Account Role Options */
/* ------------------------------------------------------------------ */

const roleOptions = [
  {
    value: "vendor",
    label: "Vendor",
    description: "List your services and reach couples planning their day.",
    icon: Store,
  },
  {
    value: "customer",
    label: "Customer",
    description: "Discover trusted vendors and plan your big day.",
    icon: HeartHandshake,
  },
] as const;

/* ------------------------------------------------------------------ */
/* ImgBB Profile Image Upload */
/* ------------------------------------------------------------------ */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadAvatarToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Image upload is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your environment variables.",
    );
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });

  const body = new FormData();
  body.append("image", base64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body,
  });

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: {
      display_url?: string;
      url?: string;
    };
  } | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error("Image upload failed. Please try another image.");
  }

  const imageUrl = payload.data.display_url ?? payload.data.url;

  if (!imageUrl) {
    throw new Error("Could not get the uploaded image URL.");
  }

  return imageUrl;
}

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
/* Sign Up Form */
/* ------------------------------------------------------------------ */

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || searchParams.get("callbackUrl");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";

  const role = useWatch({
    control,
    name: "role",
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const previewRef = React.useRef<string | null>(null);

  /* ---------------------------------------------------------------- */
  /* Clean Up Image Preview */
  /* ---------------------------------------------------------------- */

  React.useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Remove Profile Image */
  /* ---------------------------------------------------------------- */

  const removeAvatar = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setAvatarPreview(null);
    setAvatarUrl(null);
  };

  /* ---------------------------------------------------------------- */
  /* Handle Profile Image Upload */
  /* ---------------------------------------------------------------- */

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG or WebP).");
      input.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5 MB.");
      input.value = "";
      return;
    }

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }

    const preview = URL.createObjectURL(file);

    previewRef.current = preview;
    setAvatarPreview(preview);
    setAvatarUrl(null);

    setIsUploadingImage(true);

    try {
      const url = await uploadAvatarToImgbb(file);

      setAvatarUrl(url);

      toast.success("Profile image uploaded", {
        description: "Your image is ready for registration.",
      });
    } catch (error) {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }

      setAvatarPreview(null);
      setAvatarUrl(null);
      input.value = "";

      toast.error("Image upload failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Google Sign Up */
  /* ---------------------------------------------------------------- */

  const handleGoogleSignUp = async () => {
    if (!role) {
      toast.error("Please select your account type first.");
      return;
    }

    try {
      const redirectQuery = callbackURL ? `&redirect=${encodeURIComponent(callbackURL)}` : "";
      const googleCallbackURL = `${window.location.origin}/auth/callback?role=${role}${redirectQuery}`;
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: googleCallbackURL,
        newUserCallbackURL: googleCallbackURL,
      });

      if (error) {
        toast.error("Google sign-up failed", {
          description: error.message || "Please try again.",
        });
      }
    } catch (error) {
      toast.error("Google sign-up failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  /* ---------------------------------------------------------------- */
  /* Email and Password Registration */
  /* ---------------------------------------------------------------- */

  const onSubmit = handleSubmit(async (values) => {
    if (isUploadingImage) {
      toast.error("Please wait until your profile image uploads.");
      return;
    }

    try {
      const { data, error } = await authClient.signUp.email({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        image: avatarUrl ?? undefined,
      });

      if (error || !data?.user) {
        toast.error("Could not create your account", {
          description:
            error?.message || "Please check your information and try again.",
        });

        return;
      }

      // If registered as vendor, submit the vendor application
      if (values.role === "vendor") {
        try {
          const { apiRequest } = await import("@/lib/api");
          await apiRequest("/api/v1/profile/apply-vendor", { method: "POST" });
        } catch (err) {
          console.error("Vendor application request:", err);
        }
      }

      toast.success("Welcome to WedPlan!", {
        description: "Your account has been created successfully.",
      });

      if (
        callbackURL &&
        callbackURL.startsWith("/") &&
        !callbackURL.startsWith("//")
      ) {
        router.replace(callbackURL);
      } else if (values.role === "vendor") {
        router.replace(siteConfig.dashboards.vendor);
      } else {
        router.replace(siteConfig.dashboards.customer);
      }
    } catch (error) {
      toast.error("Registration failed", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
      });
    }
  });

  /* ---------------------------------------------------------------- */
  /* UI */
  /* ---------------------------------------------------------------- */

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] w-full items-center bg-gradient-to-b from-secondary/60 via-background to-accent/15 py-10">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Brand Panel */}

        <AuthAside
          headline="Every love story deserves a beautiful plan."
          description={`Join ${siteConfig.name} to discover trusted wedding vendors, keep your budget on track and manage every detail of your big day in one elegant place.`}
        />

        {/* Form Card */}

        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="lg:hidden">
              <Logo />
            </div>

            <div className="hidden lg:block">
              <Monogram className="h-10" />
            </div>

            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Create your account
            </h1>

            <p className="text-sm text-muted-foreground">
              Start planning your perfect day — or grow your wedding business.
            </p>
          </div>

          {/* Google Sign Up */}

          <div className="mt-6 flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full"
              onClick={handleGoogleSignUp}
              disabled={isSubmitting || isUploadingImage}
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />

              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                or sign up with email
              </span>

              <span className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* Registration Form */}

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-6 flex flex-col gap-5"
          >
            {/* Full Name */}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>

              <Input
                id="name"
                placeholder="e.g. Ayesha Rahman"
                autoComplete="name"
                className="h-10"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />

              {errors.name && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>

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
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="h-10 pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Live Password Checklist */}

              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {passwordRules.map((rule) => {
                  const met = rule.met(passwordValue);

                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        met ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <CircleCheck
                        className={cn("size-3.5", !met && "opacity-40")}
                        aria-hidden="true"
                      />

                      {rule.label}
                    </li>
                  );
                })}
              </ul>

              {errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Profile Image - Optional */}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="avatar">
                Profile image{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>

              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/40 p-3">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="size-14 shrink-0 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
                    <ImagePlus className="size-5" aria-hidden="true" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {isUploadingImage
                      ? "Uploading to ImgBB…"
                      : avatarUrl
                        ? "Image ready"
                        : "JPG, PNG or WebP — up to 5 MB"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {avatarUrl
                      ? "Uploaded successfully."
                      : "A face photo builds trust, especially for vendors."}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingImage || isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingImage ? (
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ImagePlus className="size-3.5" aria-hidden="true" />
                    )}
                    Upload
                  </Button>

                  {avatarPreview && !isUploadingImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove profile image"
                      onClick={removeAvatar}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Account Role */}

            <div className="flex flex-col gap-1.5">
              <Label>Account type</Label>

              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map(
                  ({ value, label, description, icon: Icon }) => {
                    const selected = role === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setValue("role", value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        aria-pressed={selected}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border bg-background hover:border-primary/40 hover:bg-secondary/50",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-lg transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>

                        <span>
                          <span
                            className={cn(
                              "block text-sm font-semibold transition-colors",
                              selected && "text-primary",
                            )}
                          >
                            {label}
                          </span>

                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {description}
                          </span>
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {errors.role && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Submit Button */}

            <Button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="h-11 w-full text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Creating your account…
                </>
              ) : isUploadingImage ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Uploading image…
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account you agree to WedPlan&apos;s Terms of
              Service and Privacy Policy.
            </p>
          </form>

          {/* Sign In Link */}

          <p className="mt-5 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={
                callbackURL
                  ? `${siteConfig.routes.signIn}?callbackURL=${encodeURIComponent(callbackURL)}`
                  : siteConfig.routes.signIn
              }
              className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
