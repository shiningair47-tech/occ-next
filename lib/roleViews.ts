import { Role, ViewKey } from "@/types";

const ALLOWED: Record<Role, ViewKey[]> = {
  admin: ["dashboard", "upload", "users", "teams", "replacements", "reports", "leaderboard"],
  setter: ["dashboard", "queue", "leaderboard", "followups"],
  closer: ["dashboard", "pipeline", "leaderboard", "followups"],
};

export function allowedViewsFor(role: Role): ViewKey[] {
  return ALLOWED[role] ?? [];
}
