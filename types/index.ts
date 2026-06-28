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

export interface ApiUser {
  email: string;
  name: string;
  role: Role;
  team: string;
  temp_password: boolean;
  active: boolean;
}

export type ViewKey =
  | "dashboard"
  | "upload"
  | "users"
  | "teams"
  | "replacements"
  | "reports"
  | "leaderboard"
  | "queue"
  | "pipeline"
  | "followups";

export interface FollowupItem {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  type: "regular" | "confirmation_am" | "confirmation_pm" | "arrival";
  status: "pending" | "done";
  completed_at?: string;
  completed_by?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  notes: string;
  source: string;
  team: string;
  setter: string;
  closer: string;
  setter_status: string;
  closer_status: string;
  whatsapp_added: boolean;
  t1: boolean;
  t2: boolean;
  t3: boolean;
  t4: boolean;
  t5: boolean;
  t6: boolean;
  appointment_date: string;
  followups: FollowupItem[];
  created_at: string;
  assigned_date: string;
  called_dates: string[];
  handoff_status: string;
  handoff_at: string;
  handoff_note: string;
  handoff_by: string;
  accepted_at: string;
  // Setter-specific fields
  qualified_at?: string;
  batch_id?: string;
  assigned_at?: string;
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
