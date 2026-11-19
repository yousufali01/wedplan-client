"use client";

import * as React from "react";
import {
  HeartHandshake,
  ImagePlus,
  Loader2,
  Save,
  ShieldCheck,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadAvatarToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Image upload is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your environment variables."
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

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const [name, setName] = React.useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isApplyingVendor, setIsApplyingVendor] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.name) {
        setName(user.name);
      }
      if (user?.avatarUrl) {
        setAvatarUrl(user.avatarUrl);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user?.name, user?.avatarUrl]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG or WebP).");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setIsUploadingImage(true);

    try {
      const uploadedUrl = await uploadAvatarToImgbb(file);
      setAvatarUrl(uploadedUrl);
      toast.success("Profile image uploaded to ImgBB!");
    } catch (err) {
      toast.error("Failed to upload image", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setAvatarPreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("/api/v1/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          image: avatarUrl ?? user?.avatarUrl,
        }),
      });

      await refetch();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Could not update profile", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyVendor = async () => {
    setIsApplyingVendor(true);
    try {
      await apiRequest("/api/v1/profile/apply-vendor", {
        method: "POST",
      });

      await refetch();
      toast.success("Vendor application submitted!", {
        description: "Your account is now pending admin approval.",
      });
    } catch (err) {
      toast.error("Failed to submit vendor application", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsApplyingVendor(false);
    }
  };

  const currentDisplayImage = avatarPreview || avatarUrl || user?.avatarUrl;

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Account Settings
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal profile details, account tier, and preferences.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
          {/* Left Column: Avatar & Summary */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="relative">
              <Avatar size="default" className="size-24 border-2 border-primary/20">
                {currentDisplayImage && (
                  <AvatarImage src={currentDisplayImage} alt={user?.name || "Avatar"} />
                )}
                <AvatarFallback className="text-xl font-bold">
                  {(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {isUploadingImage && (
                <div className="absolute inset-0 grid place-items-center rounded-full bg-background/80">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-semibold">{user?.name}</h2>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium">
              {user?.role === "admin" ? (
                <>
                  <ShieldCheck className="size-3.5 text-purple-600" aria-hidden="true" />
                  <span>Platform Admin</span>
                </>
              ) : user?.role === "vendor" ? (
                <>
                  <Store className="size-3.5 text-amber-600" aria-hidden="true" />
                  <span>
                    Vendor {user.vendorApproved ? "(Approved)" : "(Pending Review)"}
                  </span>
                </>
              ) : (
                <>
                  <HeartHandshake className="size-3.5 text-primary" aria-hidden="true" />
                  <span>Customer Account</span>
                </>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || isSaving}
              className="mt-2 w-full gap-1.5"
            >
              <ImagePlus className="size-3.5" aria-hidden="true" />
              Change Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Right Column: Edit Form & Role Controls */}
          <div className="flex flex-col gap-6">
            <form
              onSubmit={handleSaveProfile}
              className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="font-heading text-lg font-semibold">Personal Information</h3>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <span className="text-[11px] text-muted-foreground">
                  Email address cannot be changed directly for security.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving || isUploadingImage} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Saving changes…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" aria-hidden="true" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Vendor Application Box (if customer) */}
            {user?.role === "customer" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/30 p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Store className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="font-heading text-base font-semibold">
                    Are you a Wedding Vendor?
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Promote your photography, catering, venue, or decor services to thousands of
                  couples planning their weddings. Apply to upgrade your account to a Vendor profile.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyVendor}
                  disabled={isApplyingVendor}
                  className="w-fit gap-1.5"
                >
                  {isApplyingVendor ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Store className="size-3.5" aria-hidden="true" />
                  )}
                  Apply as a Vendor
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
