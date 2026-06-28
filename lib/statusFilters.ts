// Status filtering utilities extracted from components for testability

// ========== Setter Status Filters ==========

/** Qualified setter statuses (qualified + appointment_fixed) */
export const QUALIFIED_STATUSES = ["qualified", "appointment_fixed"] as const;

/** Flagged/bad setter statuses */
export const FLAGGED_STATUSES = ["bad", "wrong_number"] as const;

/** All closer pipeline statuses */
export const CLOSER_STATUSES = ["new", "hot", "cold", "arrived", "lost"] as const;

/** Check if a lead has been qualified (properly counts appointment_fixed) */
export function isQualified(setterStatus: string | null | undefined): boolean {
  return setterStatus === "qualified" || setterStatus === "appointment_fixed";
}

/** Check if a lead is flagged (bad or wrong number) */
export function isFlagged(setterStatus: string | null | undefined): boolean {
  return setterStatus === "bad" || setterStatus === "wrong_number";
}

/** Check if a lead is pending (pending or null) */
export function isPending(setterStatus: string | null | undefined): boolean {
  return !setterStatus || setterStatus === "pending";
}

// ========== Closer Status Filters ==========

/** Check if a lead is unworked (empty/null closer_status) */
export function isUnworked(closerStatus: string | null | undefined): boolean {
  return !closerStatus || closerStatus === "";
}

/** Check if a lead matches a given closer status filter */
export function matchesCloserFilter(closerStatus: string | null | undefined, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "new") return !closerStatus || closerStatus === "" || closerStatus === "new";
  return closerStatus === filter;
}

/** Check if a lead is in the intake queue (pending handoff, not yet worked) */
export function isIntakeLead(handoffStatus: string | null | undefined, closerStatus: string | null | undefined): boolean {
  return handoffStatus === "pending" && (!closerStatus || closerStatus === "");
}

/** Check if a lead is in the closer pipeline (accepted handoff) */
export function isInCloserPipeline(handoffStatus: string | null | undefined): boolean {
  return handoffStatus === "accepted";
}

// ========== Lead Interface (for testing) ==========

export interface TestLead {
  setter_status?: string | null;
  closer_status?: string | null;
  handoff_status?: string | null;
}

// ========== Compound Filters ==========

/** Filter leads for the setter queue */
export function filterSetterQueue(
  leads: TestLead[],
  filter: string
): TestLead[] {
  return leads.filter(l => filter === "all" || l.setter_status === filter);
}

/** Filter leads for the closer pipeline */
export function filterCloserPipeline(
  leads: TestLead[],
  filter: string
): TestLead[] {
  return leads.filter(l => matchesCloserFilter(l.closer_status ?? null, filter));
}

/** Get leads that match a setter status for KPI counts */
export function countBySetterStatus(
  leads: TestLead[],
  statuses: readonly string[]
): number {
  return leads.filter(l => statuses.includes(l.setter_status ?? "")).length;
}

// ========== Status Labels ==========

export const SETTER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  qualified: "Qualified",
  appointment_fixed: "Appt Fixed",
  bad: "Bad Lead",
  wrong_number: "Wrong #",
};

export function getSetterLabel(status: string | null | undefined): string {
  return SETTER_STATUS_LABELS[status ?? ""] ?? status ?? "";
}
