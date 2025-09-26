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
} from "@/interfaces";

interface RequestOptions {
  signal?: AbortSignal;
  cookie?: string;
}

const baseApi = process.env.NEXT_PUBLIC_BASE_API as string;

function resolveBaseUrl(): string {
  if (!baseApi) {
    throw new Error("NEXT_PUBLIC_BASE_API is not configured");
  }
  return baseApi;
}

export async function getUserIdByHandle(
  handle: string,
  { signal, cookie }: RequestOptions = {}
): Promise<UserHandleLookupResponse> {
  const base = resolveBaseUrl();
  const url = new URL(`/user/handle/${encodeURIComponent(handle)}`, base);

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
  const base = resolveBaseUrl();
  const url = new URL(`/user/profile/${encodeURIComponent(userId)}`, base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/follow", base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/profile/handle", base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/profile/username", base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/profile/picture", base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/email/send-otp", base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/email", base);

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

export async function getEmails(
  { signal, cookie }: RequestOptions = {}
): Promise<GetEmailsResponse> {
  const base = resolveBaseUrl();
  const url = new URL("/user/email", base);

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
  const base = resolveBaseUrl();
  const url = new URL(`/user/email/${encodeURIComponent(emailId)}`, base);

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
  const base = resolveBaseUrl();
  const url = new URL("/user/saves/videos", base);
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
  const base = resolveBaseUrl();
  const url = new URL("/user/reactions/videos", base);
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
