import axios, { type AxiosProgressEvent } from "axios";
import type {
  UploadProfileImageResponse,
  UploadVisibility,
  UploadVideoResponse,
} from "@/interfaces";
import { buildApiUrl } from "./utils";

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
  const url = buildApiUrl("media/upload");
  const formData = new FormData();
  formData.append("video", file);
  if (caption) formData.append("caption", caption);
  if (music) formData.append("music", music);
  formData.append("visibility", visibility);
  formData.append("allowComments", String(allowComments));
  orgIds?.forEach((id) => formData.append("orgIds", id));

  const response = await axios.post<UploadVideoResponse>(
    url.toString(),
    formData,
    {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.min(
            100,
            Math.max(0, Math.round((event.loaded / event.total) * 100))
          );
          onUploadProgress?.(percent, event);
        }
      },
    }
  );

  return response.data;
}

export async function uploadProfileImage(
  file: File,
  { signal }: { signal?: AbortSignal } = {}
): Promise<UploadProfileImageResponse> {
  const url = buildApiUrl("media/upload/profile");
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post<UploadProfileImageResponse>(
    url.toString(),
    formData,
    {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
      signal,
    }
  );

  return response.data;
}

export interface DeleteVideoResponse {
  message: string;
  postId: string;
}

export async function deleteVideo(
  postId: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<DeleteVideoResponse> {
  const url = buildApiUrl(`media/video/${postId}`);

  const response = await axios.delete<DeleteVideoResponse>(url.toString(), {
    withCredentials: true,
    signal,
  });

  return response.data;
}
