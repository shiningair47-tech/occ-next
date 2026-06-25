import { Role } from "@/types";

export type ViewKey =
  | "dashboard"
  | "upload"
  | "users"
  | "teams"
  | "replacements"
  | "reports"
  | "leaderboard"
  | "queue"
  | "pipeline";

const ALLOWED: Record<Role, ViewKey[]> = {
  admin: ["dashboard", "upload", "users", "teams", "replacements", "reports", "leaderboard"],
  setter: ["dashboard", "queue", "leaderboard"],
  closer: ["dashboard", "pipeline", "leaderboard"],
};

export function allowedViewsFor(role: Role): ViewKey[] {
  return ALLOWED[role] ?? [];
}
