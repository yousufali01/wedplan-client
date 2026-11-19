"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Crown,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Save,
  Settings,
  X,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { apiRequest } from "@/lib/api";
import { uploadImageToImgbb, validateImageFile } from "@/lib/imgbb";

type VendorProfile = {
  id?: string;
  name?: string;
  email?: string;
  image?: string | null;
  avatarUrl?: string | null;
  businessName?: string;
  studioName?: string;
  phone?: string;
  website?: string;
  location?: string;
  bio?: string;
  vendorApproved?: boolean;
  plan?: string;
  subscriptionPlan?: string;
  subscription?: {
    plan?: string;
    name?: string;
  };
};

type ProfileForm = {
  businessName: string;
  studioName: string;
  phone: string;
  website: string;
  location: string;
  bio: string;
};

const EMPTY_FORM: ProfileForm = {
  businessName: "",
  studioName: "",
  phone: "",
  website: "",
  location: "",
  bio: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function VendorProfilePage() {
  const { user, refetch } = useAuth();

  const [profile, setProfile] = React.useState<VendorProfile | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState<ProfileForm>(EMPTY_FORM);
  const [avatar, setAvatar] = React.useState<{
    file: File;
    preview: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const vendor = profile ?? (user as VendorProfile | null);

  const fetchProfile = React.useCallback(async () => {
    try {
      const data = await apiRequest<{ profile: VendorProfile }>(
        "/api/v1/profile/vendor",
      );
      setProfile(data.profile);
    } catch {
      // Fall back to the session user — the fields are also in the session.
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const displayName =
    vendor?.businessName ||
    vendor?.studioName ||
    vendor?.name ||
    "Your Studio";

  const planName =
    vendor?.subscription?.plan ||
    vendor?.subscription?.name ||
    vendor?.subscriptionPlan ||
    vendor?.plan ||
    "Free Plan";

  const isPremium = planName.toLowerCase().includes("premium");
  const isApproved = vendor?.vendorApproved === true;
  const avatarUrl = vendor?.image || vendor?.avatarUrl;

  const openEdit = () => {
    setForm({
      businessName: vendor?.businessName || "",
      studioName: vendor?.studioName || "",
      phone: vendor?.phone || "",
      website: vendor?.website || "",
      location: vendor?.location || "",
      bio: vendor?.bio || "",
    });
    setAvatar(null);
    setIsEditing(true);
  };

  const handleAvatarSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setAvatar((previous) => {
      if (previous) URL.revokeObjectURL(previous.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.businessName.trim()) {
      toast.error("Business name is required.");
      return;
    }

    if (form.website.trim() && !/^https?:\/\//i.test(form.website.trim())) {
      toast.error("Website must start with http:// or https://.");
      return;
    }

    setIsSaving(true);

    try {
      if (avatar) {
        const imageUrl = await uploadImageToImgbb(avatar.file);
        await apiRequest("/api/v1/profile", {
          method: "PATCH",
          body: JSON.stringify({ image: imageUrl }),
        });
      }

      await apiRequest("/api/v1/profile/vendor", {
        method: "PATCH",
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          studioName: form.studioName.trim(),
          phone: form.phone.trim(),
          website: form.website.trim(),
          location: form.location.trim(),
          bio: form.bio.trim(),
        }),
      });

      if (avatar) URL.revokeObjectURL(avatar.preview);
      setAvatar(null);
      setIsEditing(false);
      await Promise.all([fetchProfile(), refetch()]);
      toast.success("Vendor profile updated successfully.");
    } catch (error) {
      toast.error("Unable to update your profile.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#e9e1d8] pb-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[1.5px] text-primary">
              Vendor Workspace
            </p>

            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">
              Profile Settings
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create and manage your vendor profile, approval status and
              subscription plan.
            </p>
          </div>

          <Button
            onClick={openEdit}
            className="w-fit gap-2 bg-primary"
          >
            <Pencil className="size-4" />
            Edit Vendor Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Account card */}
          <section className="rounded-xl border border-[#e9e1d8] bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="font-heading text-xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold">
                    {displayName}
                  </h2>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                    Vendor Account
                  </span>
                </div>

                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {vendor?.email || "No email linked"}
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isApproved ? (
                      <BadgeCheck className="size-3" />
                    ) : (
                      <Clock3 className="size-3" />
                    )}
                    {isApproved ? "Approved Partner" : "Pending Approval"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-[#e9e1d8] pt-5 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e9e1d8] bg-[#faf9f6] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <BriefcaseBusiness className="size-4 text-primary" />
                  Business Name
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {vendor?.businessName || "Not provided"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e9e1d8] bg-[#faf9f6] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="size-4 text-primary" />
                  Booking Visibility
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {isApproved
                    ? "Visible to couples"
                    : "Hidden until approved"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e9e1d8] bg-[#faf9f6] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Phone className="size-4 text-primary" />
                  Phone
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {vendor?.phone || "Not provided"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e9e1d8] bg-[#faf9f6] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Globe className="size-4 text-primary" />
                  Website
                </p>
                <p className="mt-2 truncate text-sm font-semibold">
                  {vendor?.website || "Not provided"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e9e1d8] bg-[#faf9f6] p-4 sm:col-span-2">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <MapPin className="size-4 text-primary" />
                  Location / Service Area
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {vendor?.location || "Not provided"}
                </p>
              </div>

              {vendor?.bio && (
                <div className="rounded-xl border border-[#e9e1d8] bg-[#faf9f6] p-4 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    About Your Studio
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">
                    {vendor.bio}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Plan + actions */}
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-[#eadbb5] bg-gradient-to-r from-[#fffdf7] via-white to-[#faf8f1] p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-gold" />
                <h3 className="font-heading text-lg font-bold">
                  Current Plan
                </h3>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Your vendor workspace is running on
              </p>

              <p className="mt-1 font-heading text-2xl font-bold">{planName}</p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {isPremium
                  ? "Premium benefits are active: unlimited listings, featured placement and the premium vendor badge."
                  : "Free Plan includes up to 3 active service listings. Upgrade for unlimited growth."}
              </p>

              <Button
                variant={isPremium ? "outline" : "default"}
                size="sm"
                render={<Link href="/vendor/subscription" />}
                className="mt-4 w-full gap-2"
              >
                <Crown className="size-4" />
                {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
              </Button>
            </section>

            <section className="rounded-xl border border-[#e9e1d8] bg-white p-5 shadow-sm">
              <h3 className="font-heading text-lg font-bold">Quick Actions</h3>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  render={<Link href="/profile" />}
                  className="justify-start gap-2 border-[#e9e1d8] bg-white"
                >
                  <Settings className="size-4" />
                  Edit Account Details
                </Button>

                <Button
                  variant="outline"
                  render={<Link href="/vendor/services/new" />}
                  className="justify-start gap-2 border-[#e9e1d8] bg-white"
                >
                  <BriefcaseBusiness className="size-4" />
                  Add New Service
                </Button>

                <Button
                  variant="outline"
                  render={<Link href="/vendor/bookings" />}
                  className="justify-start gap-2 border-[#e9e1d8] bg-white"
                >
                  <CalendarDays className="size-4" />
                  View Booking Requests
                </Button>
              </div>
            </section>
          </div>
        </div>

        {/* Edit vendor profile modal */}
        {isEditing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) {
                setIsEditing(false);
              }
            }}
          >
            <div className="my-auto w-full max-w-xl rounded-2xl border border-border bg-white p-5 shadow-xl sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-bold">
                    Edit Vendor Profile
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These details are shown to couples on your services.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label="Close edit form"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.businessName}
                    onChange={(e) => updateField("businessName", e.target.value)}
                    className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Studio Name</label>
                    <input
                      maxLength={100}
                      value={form.studioName}
                      onChange={(e) => updateField("studioName", e.target.value)}
                      className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input
                      maxLength={30}
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <input
                      maxLength={300}
                      placeholder="https://your-studio.com"
                      value={form.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Location / Service Area
                    </label>
                    <input
                      maxLength={200}
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">About Your Studio</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    className="w-full rounded-lg border border-input p-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Profile Image</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar className="size-14">
                      {avatar ? (
                        <AvatarImage src={avatar.preview} alt="New avatar" />
                      ) : avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="font-heading text-lg">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Pencil className="size-3.5" />
                      Change Image
                    </Button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(avatar.preview);
                          setAvatar(null);
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional — PNG, JPG or WEBP up to 5 MB.
                  </p>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
