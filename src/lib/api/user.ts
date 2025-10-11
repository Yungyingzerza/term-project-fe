import type {
  FollowUserPayload,
  SavedVideosResponse,
  UpdateHandlePayload,
  UpdateHandleResponse,
  UpdateUsernamePayload,
  UpdateUsernameResponse,
  UpdateProfilePicturePayload,
  UpdateProfilePictureResponse,
  UserHandleLookupResponse,
  UserProfileResponse,
  UserReactionsResponse,
  SendEmailOtpPayload,
  GenericMessageResponse,
  CreateEmailPayload,
  CreateEmailResponse,
  GetEmailsResponse,
  ViewHistoryResponse,
} from "@/interfaces";
import { buildApiUrl } from "./utils";

interface RequestOptions {
  signal?: AbortSignal;
  cookie?: string;
}

export async function getUserIdByHandle(
  handle: string,
  { signal, cookie }: RequestOptions = {}
): Promise<UserHandleLookupResponse> {
  const url = buildApiUrl(`user/handle/${encodeURIComponent(handle)}`);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to lookup handle ${handle}: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UserHandleLookupResponse;
}

export async function getUserProfile(
  userId: string,
  { signal, cookie }: RequestOptions = {}
): Promise<UserProfileResponse> {
  const url = buildApiUrl(`user/profile/${encodeURIComponent(userId)}`);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch user profile: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UserProfileResponse;
}

export async function followUser(
  payload: FollowUserPayload,
  { signal, cookie }: RequestOptions = {}
): Promise<{ message: string }> {
  const url = buildApiUrl("user/follow");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to ${payload.action} user: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as { message: string };
}

export async function updateHandle(
  payload: UpdateHandlePayload,
  { signal, cookie }: RequestOptions = {}
): Promise<UpdateHandleResponse> {
  const url = buildApiUrl("user/profile/handle");

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to update handle: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UpdateHandleResponse;
}

export async function updateUsername(
  payload: UpdateUsernamePayload,
  { signal, cookie }: RequestOptions = {}
): Promise<UpdateUsernameResponse> {
  const url = buildApiUrl("user/profile/username");

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to update username: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UpdateUsernameResponse;
}

export async function updateProfilePicture(
  payload: UpdateProfilePicturePayload,
  { signal, cookie }: RequestOptions = {}
): Promise<UpdateProfilePictureResponse> {
  const url = buildApiUrl("user/profile/picture");

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to update profile picture: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UpdateProfilePictureResponse;
}

export async function sendEmailOtp(
  payload: SendEmailOtpPayload,
  { signal, cookie }: RequestOptions = {}
): Promise<GenericMessageResponse> {
  const url = buildApiUrl("user/email/send-otp");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to send email OTP: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as GenericMessageResponse;
}

export async function createEmail(
  payload: CreateEmailPayload,
  { signal, cookie }: RequestOptions = {}
): Promise<CreateEmailResponse> {
  const url = buildApiUrl("user/email");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to add email: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as CreateEmailResponse;
}

export async function getEmails({
  signal,
  cookie,
}: RequestOptions = {}): Promise<GetEmailsResponse> {
  const url = buildApiUrl("user/email");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to load emails: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as GetEmailsResponse;
}

export async function deleteEmail(
  emailId: string,
  { signal, cookie }: RequestOptions = {}
): Promise<GenericMessageResponse> {
  const url = buildApiUrl(`user/email/${encodeURIComponent(emailId)}`);

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to remove email: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as GenericMessageResponse;
}

interface PaginationParams {
  limit?: number;
  cursor?: string | null;
}

export async function getUserSavedVideos(
  params: PaginationParams = {},
  { signal, cookie }: RequestOptions = {}
): Promise<SavedVideosResponse> {
  const url = buildApiUrl("user/saves/videos");
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch saved videos: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as SavedVideosResponse;
}

export async function getUserReactions(
  params: PaginationParams = {},
  { signal, cookie }: RequestOptions = {}
): Promise<UserReactionsResponse> {
  const url = buildApiUrl("user/reactions/videos");
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch reacted videos: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UserReactionsResponse;
}

export async function getUserViewHistory(
  params: PaginationParams = {},
  { signal, cookie }: RequestOptions = {}
): Promise<ViewHistoryResponse> {
  const url = buildApiUrl("user/history/videos");
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch view history: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as ViewHistoryResponse;
}
