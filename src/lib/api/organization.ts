import type {
  Organization,
  UserOrganizationsResponse,
  InviteCode,
  GroupMember,
  CreateGroupRequest,
  CreateInviteCodeRequest,
  UpdateGroupRequest,
} from "@/interfaces";
import { buildApiUrl } from "./utils";

export interface GetUserOrganizationsParams {
  signal?: AbortSignal;
  /** Optional cookie header string for SSR requests */
  cookie?: string;
}

export async function getUserOrganizations({
  signal,
  cookie,
}: GetUserOrganizationsParams = {}): Promise<UserOrganizationsResponse> {
  const url = buildApiUrl("user/organizations");

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
      `Failed to fetch user organizations: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  const data = (await res.json()) as UserOrganizationsResponse;
  return data;
}

export interface GetOrganizationDetailParams {
  signal?: AbortSignal;
  /** Optional cookie header string for SSR requests */
  cookie?: string;
}

export interface OrganizationDetailResponse {
  organization: Organization;
}

export async function getOrganizationDetail(
  organizationId: string,
  { signal, cookie }: GetOrganizationDetailParams = {}
): Promise<Organization> {
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  const url = buildApiUrl(`organization/${organizationId}`);

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
      `Failed to fetch organization ${organizationId}: ${res.status} ${
        res.statusText
      }${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await res.json()) as OrganizationDetailResponse;
  if (!data?.organization?._id) {
    throw new Error(`Organization ${organizationId} response missing data`);
  }

  return data.organization;
}

// Create a new group
export interface CreateGroupResponse {
  message: string;
  organization: Organization;
}

export async function createGroup(
  data: CreateGroupRequest,
  signal?: AbortSignal
): Promise<CreateGroupResponse> {
  const url = buildApiUrl("organization");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create group: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Create an invite code for a group
export interface CreateInviteCodeResponse {
  message: string;
  invite: InviteCode;
}

export async function createInviteCode(
  organizationId: string,
  data: CreateInviteCodeRequest = {},
  signal?: AbortSignal
): Promise<CreateInviteCodeResponse> {
  const url = buildApiUrl(`organization/${organizationId}/invites`);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create invite code: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Get all invite codes for a group
export interface GetInviteCodesResponse {
  invites: InviteCode[];
}

export async function getInviteCodes(
  organizationId: string,
  signal?: AbortSignal
): Promise<GetInviteCodesResponse> {
  const url = buildApiUrl(`organization/${organizationId}/invites`);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to get invite codes: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Revoke an invite code
export interface RevokeInviteCodeResponse {
  message: string;
}

export async function revokeInviteCode(
  inviteCode: string,
  signal?: AbortSignal
): Promise<RevokeInviteCodeResponse> {
  const url = buildApiUrl(`organization/invites/${inviteCode}`);

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to revoke invite code: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Join a group using an invite code
export interface JoinGroupResponse {
  message: string;
  organization: Organization;
}

export async function joinGroupWithInvite(
  inviteCode: string,
  signal?: AbortSignal
): Promise<JoinGroupResponse> {
  const url = buildApiUrl(`organization/join/${inviteCode}`);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to join group: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Get members of a group
export interface GetGroupMembersResponse {
  members: GroupMember[];
}

export async function getGroupMembers(
  organizationId: string,
  signal?: AbortSignal
): Promise<GetGroupMembersResponse> {
  const url = buildApiUrl(`organization/${organizationId}/members`);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to get group members: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Remove a member from a group
export interface RemoveMemberResponse {
  message: string;
}

export async function removeMember(
  organizationId: string,
  userId: string,
  signal?: AbortSignal
): Promise<RemoveMemberResponse> {
  const url = buildApiUrl(`organization/${organizationId}/members/${userId}`);

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to remove member: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Leave a group
export interface LeaveGroupResponse {
  message: string;
}

export async function leaveGroup(
  organizationId: string,
  signal?: AbortSignal
): Promise<LeaveGroupResponse> {
  const url = buildApiUrl(`organization/${organizationId}/leave`);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to leave group: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}

// Update group information
export interface UpdateGroupResponse {
  message: string;
  organization: Organization;
}

export async function updateGroup(
  organizationId: string,
  data: UpdateGroupRequest,
  signal?: AbortSignal
): Promise<UpdateGroupResponse> {
  const url = buildApiUrl(`organization/${organizationId}`);

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal,
    credentials: "include",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to update group: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return await res.json();
}
