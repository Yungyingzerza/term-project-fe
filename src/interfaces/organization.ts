export interface Organization {
  _id: string;
  name: string;
  description?: string;
  logo_url?: string;
  domains?: string[];
  is_work_org?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserOrganizationsResponse {
  organizations: Organization[];
}

export interface InviteCode {
  invite_code: string;
  expires_at: string;
  max_uses: number | null;
  current_uses: number;
  is_active?: boolean;
  created_at?: string;
}

export interface GroupMember {
  user_id: {
    _id: string;
    handle: string;
    username: string;
    profile_picture_url?: string;
  };
  role: "admin" | "member";
  created_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  logo_url?: string;
}

export interface CreateInviteCodeRequest {
  expiresInDays?: number;
  maxUses?: number | null;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  logo_url?: string;
}
