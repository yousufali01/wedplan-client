
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

type SelectedImage = {
  file: File;
  preview: string;
};

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

const MAX_IMAGES = 6;

export default function AddNewServicePage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    name: "",
    category: "Photography & Videography",
    price: "",
    location: "",
    description: "",
  });

  const [selectedImages, setSelectedImages] = React.useState<
    SelectedImage[]
  >([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateField = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    addImages(files);

    // Allows selecting the same file again after removing it.
    event.target.value = "";
  };

  const addImages = (files: File[]) => {
    const remainingSlots = MAX_IMAGES - selectedImages.length;

    if (remainingSlots <= 0) {
      toast.error("You can upload a maximum of 6 images.");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image.`);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} must be smaller than 5 MB.`);
        return false;
      }

      return true;
    });

    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added.`);
    }

    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev[index];

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return prev.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ImgBB API key is missing. Please configure NEXT_PUBLIC_IMGBB_API_KEY.",
      );
    }

    const uploadData = new FormData();
    uploadData.append("image", file);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: uploadData,
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success || !result.data?.url) {
      throw new Error(
        result.error?.message || "Unable to upload image to ImgBB.",
      );
    }

    return result.data.url;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.location.trim() ||
      !formData.description.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const price = Number(formData.price);

    if (
      formData.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error("Please enter a valid starting price.");
      return;
    }

    if (selectedImages.length === 0) {
      toast.error("Please upload at least one service image.");
      return;
    }

    setIsSubmitting(true);

    try {
      toast.info("Uploading your service images...");

      const imageUrls: string[] = [];

      for (const image of selectedImages) {
        const imageUrl = await uploadToImgBB(image.file);
        imageUrls.push(imageUrl);
      }

      await apiRequest("/api/v1/services", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          price,
          location: formData.location.trim(),
          description: formData.description.trim(),
          images: imageUrls,
          image: imageUrls[0] || "",
        }),
      });

      toast.success("Your service is now live on WedPlan!");

      selectedImages.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });

      router.push("/vendor/services");
      router.refresh();
    } catch (error) {
      console.error("Create service error:", error);

      toast.error("Unable to publish your service.", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <div className="flex flex-col gap-6">
        {/* Back button */}
          <Link
            href="/vendor/services"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to My Services
          </Link>

          {/* Header */}
          <div className="mb-7 border-b border-[#e9e1d8] pb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Vendor Workspace
            </p>

            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              Add New Wedding Service
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Share your wedding service with couples — it goes live on
              WedPlan straight away.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-[#e9e1d8] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="font-heading text-xl font-bold">
                  Service Information
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Provide the details of your wedding service.
                </p>
              </div>

              <div className="space-y-5">
                {/* Service Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="serviceName"
                    className="text-sm font-medium"
                  >
                    Service Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="serviceName"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder="e.g. Premium Wedding Photography"
                    value={formData.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    className="h-12 w-full rounded-lg border border-input bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
                  />
                </div>

                {/* Category and Price */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="serviceCategory"
                      className="text-sm font-medium"
                    >
                      Service Category{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="serviceCategory"
                      required
                      value={formData.category}
                      onChange={(e) =>
                        updateField("category", e.target.value)
                      }
                      className="h-12 w-full rounded-lg border border-input bg-white px-4 text-sm outline-none focus:border-primary"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="servicePrice"
                      className="text-sm font-medium"
                    >
                      Starting Price (USD){" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="servicePrice"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 500"
                      value={formData.price}
                      onChange={(e) =>
                        updateField("price", e.target.value)
                      }
                      className="h-12 w-full rounded-lg border border-input bg-white px-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label
                    htmlFor="serviceLocation"
                    className="text-sm font-medium"
                  >
                    Location / Coverage Area{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="serviceLocation"
                    required
                    placeholder="e.g. Dhaka, Bangladesh"
                    value={formData.location}
                    onChange={(e) =>
                      updateField("location", e.target.value)
                    }
                    className="h-12 w-full rounded-lg border border-input bg-white px-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="serviceDescription"
                    className="text-sm font-medium"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="serviceDescription"
                    required
                    minLength={10}
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe your wedding service, packages, and what makes it special..."
                    value={formData.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    className="w-full resize-y rounded-lg border border-input bg-white p-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary"
                  />

                  <p className="text-right text-xs text-muted-foreground">
                    {formData.description.length}/2000
                  </p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-2xl border border-[#e9e1d8] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5">
                <h2 className="font-heading text-xl font-bold">
                  Service Images
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Upload up to 6 images. The first image will be your
                  cover image.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                type="button"
                disabled={selectedImages.length >= MAX_IMAGES}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  addImages(Array.from(e.dataTransfer.files));
                }}
                className={`flex min-h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-7 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-[#d9d0c5] bg-[#faf9f6] hover:border-primary hover:bg-primary/5"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Upload className="size-6" />
                </div>

                <span className="text-sm font-semibold">
                  Click to upload or drag and drop
                </span>

                <span className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 5 MB each
                </span>

                <span className="mt-2 text-xs font-medium text-primary">
                  {selectedImages.length}/{MAX_IMAGES} images selected
                </span>
              </button>

              {/* Image previews */}
              {selectedImages.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selectedImages.map((image, index) => (
                    <div
                      key={image.preview}
                      className="group relative overflow-hidden rounded-xl border border-[#e9e1d8] bg-[#f2eee8]"
                    >
                      <img
                        src={image.preview}
                        alt={`Service preview ${index + 1}`}
                        className="h-36 w-full object-cover sm:h-40"
                      />

                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm">
                          Cover Image
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white text-red-600 shadow transition-colors hover:bg-red-50"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review notice */}
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-amber-700" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Admin Review Required
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Your service will be submitted with Pending status.
                  It will become visible in the public service listing
                  after admin approval.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#e9e1d8] pt-5 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.push("/vendor/services")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-48 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Publishing...
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
    </ProtectedRoute>
  );
}
