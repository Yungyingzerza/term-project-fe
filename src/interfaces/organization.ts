export interface Organization {
  _id: string;
  name: string;
  logo_url?: string;
  domains?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserOrganizationsResponse {
  organizations: Organization[];
}
