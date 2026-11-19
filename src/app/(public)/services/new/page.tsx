
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const categories = [
  "Photography & Videography",
  "Wedding Venues",
  "Catering",
  "Decoration",
  "Bridal Makeup",
  "Wedding Planning",
  "Music & Entertainment",
  "Wedding Attire",
  "Florist",
  "Transportation",
  "Other",
];

type UploadedImage = {
  file: File;
  preview: string;
};

export default function AddServicePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const vendor = user as
    | { vendorApproved?: boolean }
    | null;

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (images.length + files.length > 6) {
      toast.error("You can upload a maximum of 6 images.");
      event.target.value = "";
      return;
    }

    const validFiles: UploadedImage[] = [];

    for (const file of files) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        toast.error(`${file.name}: Only PNG, JPG and WebP are allowed.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Image must be under 5MB.`);
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setImages((prev) => [...prev, ...validFiles]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];

      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  React.useEffect(() => {
    return () => {
      images.forEach((image) =>
        URL.revokeObjectURL(image.preview)
      );
    };
    // Cleanup on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadImages = async (): Promise<string[]> => {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

    if (!apiKey) {
      throw new Error("ImgBB API key is missing. Check .env.local.");
    }

    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      setUploadProgress(
        `Uploading image ${i + 1} of ${images.length}...`
      );

      const formData = new FormData();
      formData.append("image", images[i].file);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.url) {
        throw new Error(
          result.error?.message || "Image upload failed."
        );
      }

      uploadedUrls.push(result.data.url);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim() || !category || !price || !location.trim() || !description.trim()) {
      toast.error("Please complete all service details.");
      return;
    }

    if (Number(price) < 0 || !Number.isFinite(Number(price))) {
      toast.error("Please enter a valid starting price.");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one service image.");
      return;
    }

    if (vendor?.vendorApproved !== true) {
      toast.error("Your vendor account must be approved first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls = await uploadImages();

      setUploadProgress("Publishing your service...");

      await apiRequest("/api/v1/services", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          category,
          price: Number(price),
          location: location.trim(),
          description: description.trim(),
          images: imageUrls,
          image: imageUrls[0],
        }),
      });

      toast.success("Service published successfully!", {
        description: "It is now live on WedPlan for couples to discover.",
      });

      router.push("/vendor/services");
      router.refresh();
    } catch (error) {
      toast.error("Unable to publish service.", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="min-h-screen bg-[#faf9f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          <Link
            href="/vendor/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>

          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Crown className="size-4 text-gold" />
              Vendor Workspace
            </div>

            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              Add New Wedding Service
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Publish a new wedding package. Submissions start as
              Pending until reviewed by an administrator.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-7 rounded-2xl border border-[#e9e1d8] bg-white p-5 shadow-sm sm:p-8"
          >
            <div>
              <h2 className="font-heading text-xl font-semibold">
                Service Details
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Provide clear pricing, location coverage, and
                high-resolution photographs.
              </p>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <label htmlFor="serviceName" className="text-sm font-medium">
                Service Name <span className="text-red-500">*</span>
              </label>

              <input
                id="serviceName"
                required
                minLength={3}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Wedding Photography Package"
                className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Category and Price */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Service Category <span className="text-red-500">*</span>
                </label>

                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select a category</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Starting Price (USD) <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>

                  <input
                    id="price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="500"
                    className="h-12 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location / Coverage Area <span className="text-red-500">*</span>
              </label>

              <input
                id="location"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhaka, Chittagong, Sylhet"
                className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Service Description <span className="text-red-500">*</span>
              </label>

              <textarea
                id="description"
                required
                minLength={10}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your wedding service, packages, facilities and what makes your service special..."
                className="w-full resize-y rounded-lg border border-input bg-background p-4 text-sm leading-6 outline-none focus:border-primary"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">
                  Service Images (Up to 6 files, uploaded to ImgBB)
                  <span className="text-red-500"> *</span>
                </label>

                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, or WebP up to 5MB each. First image is
                  used as the cover.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 6}
                className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/25 bg-primary/[0.025] px-4 py-6 text-center transition hover:border-primary hover:bg-primary/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Upload className="size-6" />
                </div>

                <span className="mt-3 text-sm font-semibold">
                  Select Image Files
                </span>

                <span className="mt-1 text-xs text-muted-foreground">
                  {images.length}/6 images selected
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                hidden
                onChange={handleImageSelect}
              />

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={image.preview}
                      className="group relative overflow-hidden rounded-xl border border-border"
                    >
                      <img
                        src={image.preview}
                        alt={`Service preview ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />

                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-white">
                          Cover Image
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white text-red-600 shadow"
                        aria-label="Remove image"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Notice */}
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Admin Review Required
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Your service will remain pending until an
                  administrator reviews and approves it.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {uploadProgress || "Publishing..."}
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-4" />
                    Publish Service for Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
