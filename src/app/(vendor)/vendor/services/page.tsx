"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  BriefcaseBusiness,
  MapPin,
  CheckCircle2,
  Clock3,
  XCircle,
  X,
  Save,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { uploadImageToImgbb, validateImageFile } from "@/lib/imgbb";

type ServiceItem = {
  _id: string;
  name: string;
  category: string;
  price: number;
  location: string;
  description: string;
  image?: string;
  images?: string[];
  availability: boolean;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
};

type ServiceResponse = {
  services: ServiceItem[];
};

export default function MyServicesPage() {
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [editingService, setEditingService] =
    React.useState<ServiceItem | null>(null);

  const [editForm, setEditForm] = React.useState({
    name: "",
    category: "",
    price: "",
    location: "",
    description: "",
  });

  const [editImage, setEditImage] = React.useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest<ServiceResponse>(
        "/api/v1/services/mine",
      );

      setServices(response.services || []);
    } catch (error) {
      console.error("My services error:", error);

      toast.error("Unable to load your services.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchServices();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchServices]);

  // Edit service
  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setEditImage(null);

    setEditForm({
      name: service.name,
      category: service.category,
      price: String(service.price),
      location: service.location || "",
      description: service.description || "",
    });
  };

  const handleEditImageSelect = (
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

    setEditImage((previous) => {
      if (previous) URL.revokeObjectURL(previous.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingService) return;

    if (
      !editForm.name.trim() ||
      !editForm.category ||
      !editForm.location.trim() ||
      !editForm.description.trim() ||
      !Number.isFinite(Number(editForm.price)) ||
      Number(editForm.price) < 0
    ) {
      toast.error("Please enter valid service information.");
      return;
    }

    setUpdatingId(editingService._id);

    try {
      let imageFields: { images?: string[]; image?: string } = {};

      if (editImage) {
        setIsUploadingImage(true);
        const imageUrl = await uploadImageToImgbb(editImage.file);
        imageFields = { images: [imageUrl], image: imageUrl };
      }

      await apiRequest(`/api/v1/services/${editingService._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category,
          price: Number(editForm.price),
          location: editForm.location.trim(),
          description: editForm.description.trim(),
          ...imageFields,
        }),
      });

      toast.success("Service updated successfully.");

      if (editImage) URL.revokeObjectURL(editImage.preview);
      setEditImage(null);
      setEditingService(null);
      await fetchServices();
    } catch (error) {
      toast.error("Unable to update service.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUploadingImage(false);
      setUpdatingId(null);
    }
  };

  // Active / Inactive
  const handleAvailability = async (service: ServiceItem) => {
    const newAvailability = !service.availability;

    setUpdatingId(service._id);

    try {
      await apiRequest(`/api/v1/services/${service._id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({
          availability: newAvailability,
        }),
      });

      setServices((prev) =>
        prev.map((item) =>
          item._id === service._id
            ? { ...item, availability: newAvailability }
            : item,
        ),
      );

      toast.success(
        newAvailability
          ? "Service activated successfully."
          : "Service deactivated successfully.",
      );
    } catch (error) {
      toast.error("Unable to change service status.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete service
  const handleDelete = async (service: ServiceItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(service._id);

    try {
      await apiRequest(`/api/v1/services/${service._id}`, {
        method: "DELETE",
      });

      setServices((prev) => prev.filter((item) => item._id !== service._id));

      toast.success("Service deleted successfully.");
    } catch (error) {
      toast.error("Unable to delete service.", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatus = (status?: string) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          icon: CheckCircle2,
          style: "bg-emerald-100 text-emerald-700",
        };

      case "rejected":
        return {
          label: "Rejected",
          icon: XCircle,
          style: "bg-red-100 text-red-700",
        };

      default:
        return {
          label: "Pending",
          icon: Clock3,
          style: "bg-amber-100 text-amber-700",
        };
    }
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

  const approvedCount = services.filter(
    (service) => service.status === "approved",
  ).length;

  const pendingCount = services.filter(
    (service) => !service.status || service.status === "pending",
  ).length;

  const rejectedCount = services.filter(
    (service) => service.status === "rejected",
  ).length;

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="flex flex-col gap-6">
        {/* Header */}
          <div className="flex flex-col justify-between gap-5 border-b border-[#e9e1d8] pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Vendor Workspace
              </p>

              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                My Services
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Manage your wedding packages, pricing and service availability.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchServices()}
                disabled={isLoading}
                className="gap-2 bg-white"
              >
                <RefreshCw
                  className={`size-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                render={<Link href="/vendor/services/new" />}
                className="gap-2"
              >
                <Plus className="size-4" />
                Add New Service
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e9e1d8] bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Total Services</p>
              <p className="mt-2 font-heading text-3xl font-bold">
                {isLoading ? "—" : services.length}
              </p>
            </div>

            <div className="rounded-xl border border-[#e9e1d8] bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Approved Services</p>
              <p className="mt-2 font-heading text-3xl font-bold text-emerald-600">
                {isLoading ? "—" : approvedCount}
              </p>
            </div>

            <div className="rounded-xl border border-[#e9e1d8] bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">
                Pending / Rejected
              </p>
              <p className="mt-2 font-heading text-3xl font-bold text-amber-600">
                {isLoading ? "—" : `${pendingCount} / ${rejectedCount}`}
              </p>
            </div>
          </div>

          {/* Service List */}
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  Your Published Services
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  All your submitted services and their approval status.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-60 items-center justify-center rounded-xl border border-[#e9e1d8] bg-white">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>
            ) : services.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#d9d0c5] bg-white px-5 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BriefcaseBusiness className="size-8" />
                </div>

                <h3 className="mt-4 font-heading text-xl font-semibold">
                  No Services Yet
                </h3>

                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  You have not published any wedding services. Create your first
                  service to get started.
                </p>

                <Button
                  render={<Link href="/vendor/services/new" />}
                  className="mt-5 gap-2"
                >
                  <Plus className="size-4" />
                  Add Your First Service
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => {
                  const status = getStatus(service.status);
                  const StatusIcon = status.icon;

                  const coverImage = service.images?.[0] || service.image;

                  return (
                    <article
                      key={service._id}
                      className="flex flex-col gap-4 rounded-xl border border-[#e9e1d8] bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:gap-5 sm:p-4"
                    >
                      {/* Image */}
                      <div className="h-48 w-full shrink-0 overflow-hidden rounded-lg bg-[#f2eee8] sm:h-[125px] sm:w-[150px]">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={service.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImagePlus className="size-8" />
                          </div>
                        )}
                      </div>

                      {/* Service Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-primary">
                            {service.category}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.style}`}
                          >
                            <StatusIcon className="size-3" />
                            {status.label}
                          </span>
                        </div>

                        <h3 className="mt-2 font-heading text-lg font-bold leading-tight">
                          {service.name}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {service.category === "Wedding Venues"
                            ? "Wedding Venues"
                            : service.category}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {service.location || "Location not specified"}
                          </span>

                          <span className="font-semibold text-foreground">
                            ৳{Number(service.price).toLocaleString("en-BD")}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-4 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {service.availability ? "Active" : "Inactive"}
                          </span>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={service.availability}
                            aria-label={`Set ${service.name} ${service.availability ? "inactive" : "active"}`}
                            disabled={
                              updatingId === service._id ||
                              deletingId === service._id
                            }
                            onClick={() => handleAvailability(service)}
                            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                              service.availability
                                ? "bg-emerald-500"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
                                service.availability ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              updatingId === service._id ||
                              deletingId === service._id
                            }
                            onClick={() => openEditModal(service)}
                            className="gap-1.5"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              deletingId === service._id ||
                              updatingId === service._id
                            }
                            onClick={() => handleDelete(service)}
                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            {deletingId === service._id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

        {/* Edit Modal */}
        {editingService && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setEditingService(null);
              }
            }}
          >
            <div className="my-auto w-full max-w-xl rounded-2xl border border-border bg-white p-5 shadow-xl sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-bold">
                    Edit Service
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Update your wedding service details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Close edit form"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Name</label>
                  <input
                    required
                    minLength={3}
                    maxLength={100}
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      required
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-primary"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Starting Price (USD)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Location / Coverage Area
                  </label>
                  <input
                    required
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input p-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Image</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e9e1d8] bg-[#f2eee8]">
                      {editImage ? (
                        <img
                          src={editImage.preview}
                          alt="New cover preview"
                          className="size-full object-cover"
                        />
                      ) : editingService.images?.[0] || editingService.image ? (
                        <img
                          src={editingService.images?.[0] || editingService.image}
                          alt="Current cover"
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="size-6 text-muted-foreground" />
                      )}
                    </div>

                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editFileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <ImagePlus className="size-3.5" />
                      Replace Image
                    </Button>

                    {editImage && (
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(editImage.preview);
                          setEditImage(null);
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove new image
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional — PNG, JPG or WEBP up to 5 MB.
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Editing a service does not change its approval status. A new
                  cover image replaces the existing gallery image.
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService(null)}
                    disabled={updatingId === editingService._id || isUploadingImage}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={updatingId === editingService._id || isUploadingImage}
                    className="gap-2"
                  >
                    {updatingId === editingService._id || isUploadingImage ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isUploadingImage ? "Uploading image..." : "Save Changes"}
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
