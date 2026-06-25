export type Role = "admin" | "setter" | "closer";

export interface User {
  email: string;
  name: string;
  role: Role;
  team: string;
  password: string;
  temp_password: boolean;
  active: boolean;
}

export interface SessionData {
  currentEmail: string;
  previewRole: string;
  previewEmail: string;
}

export interface MemberPreviewOption {
  email: string;
  label: string;
  role: Role;
  team: string;
  role_label: string;
  team_label: string;
  name: string;
}
