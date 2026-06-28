"use client";
import { useState, useEffect, useCallback } from "react";
import { Calendar, Phone, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Lead, FollowupItem } from "@/types";
import { TableSkeleton } from "@/components/LoadingSkeleton";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getStatusBadge(f: FollowupItem) {
  const today = getTodayStr();
  if (f.status === "done") return { label: "Done", cls: "bg-green-100 text-green-700 border-green-200" };
  if (f.scheduled_date < today) return { label: "Overdue", cls: "bg-red-100 text-red-700 border-red-200" };
  if (f.scheduled_date === today) return { label: "Due Today", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Upcoming", cls: "bg-blue-100 text-blue-700 border-blue-200" };
}

const TYPE_LABELS: Record<string, string> = {
  regular: "Follow-up Call",
  confirmation_am: "AM Confirmation",
  confirmation_pm: "PM Confirmation",
  arrival: "Arrival Check-in",
};

function getTypeIcon(type: string) {
  if (type === "confirmation_am" || type === "confirmation_pm") return "📞";
  if (type === "arrival") return "✅";
  return "📋";
}

interface Props {
  userName: string;
}

export default function FollowupsPage({ userName }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads?scope=followups");
      if (!res.ok) { setError("Failed to load followups."); setLoading(false); return; }
      const data = await res.json();
      setLeads((data.leads || []).filter((l: Lead) => l.followups?.some(f => f.status === "pending")));
    } catch {
      setError("Network error loading followups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function markDone(leadId: string, followupId: string) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_followup", leadId, followupId }),
      });
      if (res.ok) loadLeads();
    } catch { }
  }

  async function markArrived(leadId: string) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_arrived", leadId }),
      });
      if (res.ok) loadLeads();
    } catch { }
  }

  const sorted = [...leads].sort((a, b) => {
    const aP = a.followups.filter(f => f.status === "pending");
    const bP = b.followups.filter(f => f.status === "pending");
    const aO = aP.some(f => f.scheduled_date < getTodayStr()) ? 0 : 1;
    const bO = bP.some(f => f.scheduled_date < getTodayStr()) ? 0 : 1;
    if (aO !== bO) return aO - bO;
    const aD = aP.some(f => f.scheduled_date === getTodayStr()) ? 0 : 1;
    const bD = bP.some(f => f.scheduled_date === getTodayStr()) ? 0 : 1;
    return aD - bD;
  });
  if (loading) return <TableSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Calendar className="h-12 w-12 text-neutral-300 mb-4" />
        <p className="text-lg font-semibold text-neutral-400 mb-1">No Pending Followups</p>
        <p className="text-sm text-neutral-400">Clients with upcoming appointments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Pending Follow-ups</h2>
          <p className="text-sm text-neutral-500 mt-1">{sorted.length} lead{sorted.length !== 1 ? "s" : ""} with pending follow-ups</p>
        </div>
        <button onClick={loadLeads} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-600 hover:bg-[#faf8f3] hover:border-neutral-300 transition-colors cursor-pointer">
          <Loader2 className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {sorted.map(lead => {
        const pending = lead.followups.filter(f => f.status === "pending");
        const hasOverdue = pending.some(f => f.scheduled_date < getTodayStr());
        const hasDueToday = pending.some(f => f.scheduled_date === getTodayStr());

        return (
          <div key={lead.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div>
                <p className="font-semibold text-[#1a1a1a]">{lead.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Phone className="h-3 w-3" /> {lead.phone}
                  </span>
                  <span className="text-xs text-neutral-400">|</span>
                  <span className="text-xs text-neutral-500">{lead.source}</span>
                  {lead.appointment_date && (
                    <>
                      <span className="text-xs text-neutral-400">|</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-gold-dark">
                        <Calendar className="h-3 w-3" /> Appt: {formatDate(lead.appointment_date)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasOverdue && (
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold border border-red-200">
                    {pending.filter(f => f.scheduled_date < getTodayStr()).length} Overdue
                  </span>
                )}
                {hasDueToday && !hasOverdue && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">Due Today</span>
                )}
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-2">
                {lead.followups.map(f => {
                  const badge = getStatusBadge(f);
                  return (
                    <div key={f.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#fdfbf6] border border-neutral-100">
                      <div className="flex items-center gap-3">
                        <span className="text-base">{getTypeIcon(f.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-[#1a1a1a]">{TYPE_LABELS[f.type] || f.type}</p>
                          <p className="text-xs text-neutral-500"><Clock className="h-3 w-3 inline mr-1" />{formatDate(f.scheduled_date)} at {f.scheduled_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>{badge.label}</span>
                        {f.status === "pending" && (
                          <button onClick={() => markDone(lead.id, f.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors cursor-pointer">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pending.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-end">
                  <button onClick={() => markArrived(lead.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors cursor-pointer">
                    <CheckCircle2 className="h-4 w-4" /> Mark as Arrived
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
