import axios, { type AxiosProgressEvent } from "axios";
import type {
  UploadVisibility,
  UploadVideoResponse,
} from "@/interfaces";

export interface UploadVideoParams {
  file: File;
  caption?: string;
  music?: string;
  visibility: UploadVisibility;
  allowComments?: boolean;
  orgIds?: string[];
  signal?: AbortSignal;
  onUploadProgress?: (percent: number, event: AxiosProgressEvent) => void;
}

export async function uploadVideo({
  file,
  caption,
  music,
  visibility,
  allowComments = true,
  orgIds,
  signal,
  onUploadProgress,
}: UploadVideoParams): Promise<UploadVideoResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_API;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_API is not configured");
  }

  const url = new URL("/media/upload", baseUrl);
  const formData = new FormData();
  formData.append("video", file);
  if (caption) formData.append("caption", caption);
  if (music) formData.append("music", music);
  formData.append("visibility", visibility);
  formData.append("allowComments", String(allowComments));
  orgIds?.forEach((id) => formData.append("orgIds", id));

  const response = await axios.post<UploadVideoResponse>(url.toString(), formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
    signal,
    onUploadProgress: (event) => {
      if (event.total) {
        const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
        onUploadProgress?.(percent, event);
      }
    },
  });

  return response.data;
}
