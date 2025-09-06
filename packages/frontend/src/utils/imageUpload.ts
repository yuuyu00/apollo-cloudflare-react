export interface ImageUploadResult {
  success: boolean;
  key: string;
  size: number;
  type: string;
}

export interface ImageUploadError {
  error: string;
}

export async function uploadImage(
  file: File,
  apiUrl: string = import.meta.env.VITE_IMAGE_UPLOAD_URL,
  getToken?: () => Promise<string | null>
): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${apiUrl}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = (await response.json()) as ImageUploadError;
    throw new Error(error.error || "Failed to upload image");
  }

  return response.json();
}
