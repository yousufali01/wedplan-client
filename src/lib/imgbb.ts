/**
 * Shared ImgBB uploader for vendor profile / service images.
 * Requires the browser-safe NEXT_PUBLIC_IMGBB_API_KEY in client .env.
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return `${file.name} is not a valid image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name} must be smaller than 5 MB.`;
  }
  return null;
}

export async function uploadImageToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Image upload is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your environment variables.",
    );
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
    { method: "POST", body: formData },
  );

  const result = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: { url?: string };
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.success || !result.data?.url) {
    throw new Error(result?.error?.message || "Unable to upload image to ImgBB.");
  }

  return result.data.url;
}
