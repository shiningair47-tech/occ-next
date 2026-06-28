"use client";
import { useState, useEffect, useCallback } from "react";
import { Calendar, Phone, CheckCircle2, Clock, AlertCircle, Flame, Snowflake, MessageSquare, X } from "lucide-react";
import { Lead, FollowupItem } from "@/types";
import { FollowupCardSkeleton } from "@/components/LoadingSkeleton";

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
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads?scope=followups");
      if (!res.ok) { setError("Failed to load followups."); setLoading(false); return; }
      const data = await res.json();
      setLeads((data.leads || []).filter((l: Lead) => l.t1 || l.followups?.some(f => f.status === "pending")));
    } catch {
      setError("Network error loading followups.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function silentRefresh() {
    try {
      const res = await fetch("/api/leads?scope=followups");
      if (res.ok) {
        const data = await res.json();
        setLeads((data.leads || []).filter((l: Lead) => l.t1 || l.followups?.some(f => f.status === "pending")));
      }
    } catch {}
  }

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function markDone(leadId: string, followupId: string) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_followup", leadId, followupId }),
      });
      if (res.ok) silentRefresh();
    } catch { }
  }

  async function markArrived(leadId: string) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_arrived", leadId }),
      });
      if (res.ok) silentRefresh();
    } catch { }
  }

  async function toggleTouchpoint(leadId: string, key: string, current: boolean) {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_touchpoints", leadId, touchpoint: key, value: !current }),
    });
    await silentRefresh();
  }

  async function saveNote(leadId: string, touchpointKey: string) {
    const note = noteDrafts[`${leadId}_${touchpointKey}`] || "";
    setSavingNote(prev => ({ ...prev, [`${leadId}_${touchpointKey}`]: true }));
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_touchpoint_note", leadId, touchpointKey, note }),
      });
      await silentRefresh();
      // Keep the notes panel open so user can see the saved note
      setExpandedNotes(prev => ({ ...prev, [`${leadId}_${touchpointKey}`]: true }));
    } finally {
      setSavingNote(prev => ({ ...prev, [`${leadId}_${touchpointKey}`]: false }));
    }
  }

  const hotLeads = leads.filter(l => l.closer_status === "hot");
  const coldLeads = leads.filter(l => l.closer_status === "cold" || !l.closer_status || l.closer_status === "new");
  const otherLeads = leads.filter(l => l.closer_status && l.closer_status !== "hot" && l.closer_status !== "cold" && l.closer_status !== "new" && l.closer_status !== "");


function sortLeads(list: Lead[]) {
  return [...list].sort((a, b) => {
    const aP = a.followups.filter(f => f.status === "pending");
    const bP = b.followups.filter(f => f.status === "pending");
    const aO = aP.some(f => f.scheduled_date < getTodayStr()) ? 0 : 1;
    const bO = bP.some(f => f.scheduled_date < getTodayStr()) ? 0 : 1;
    if (aO !== bO) return aO - bO;
    const aD = aP.some(f => f.scheduled_date === getTodayStr()) ? 0 : 1;
    const bD = bP.some(f => f.scheduled_date === getTodayStr()) ? 0 : 1;
    return aD - bD;
  });
}
  
  function renderLeadCard(lead: Lead) {
    const pending = lead.followups.filter(f => f.status === "pending");
    const tpKeys: [string, string, boolean][] = [
      ["1", "t1", lead.t1 as unknown as boolean],
      ["2", "t2", lead.t2 as unknown as boolean],
      ["3", "t3", lead.t3 as unknown as boolean],
      ["4", "t4", lead.t4 as unknown as boolean],
      ["5", "t5", lead.t5 as unknown as boolean],
      ["6", "t6", lead.t6 as unknown as boolean],
      ["WA", "whatsapp", lead.whatsapp_added as unknown as boolean],
    ];

    return (
      <div key={lead.id} className="bg-white rounded-xl border border-[#e8e4db] p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-[#1a1a1a] text-base">{lead.name || "Untitled"}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
              {lead.source && (
                <span className="px-2 py-0.5 rounded-full bg-[#f5f3ee] text-[10px] font-medium text-neutral-600">
                  {lead.source}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lead.appointment_date && (
              <span className="text-xs text-neutral-500 flex items-center gap-1 bg-[#f5f3ee] px-2 py-1 rounded-md">
                <Calendar className="h-3 w-3" />
                {formatDate(lead.appointment_date)}
              </span>
            )}
            {lead.followup_frequency && (
              <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
                lead.followup_frequency === 2
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              }`}>
                {lead.followup_frequency === 2 ? (
                  <><Flame className="h-3 w-3" /> Hot</>
                ) : (
                  <><Snowflake className="h-3 w-3" /> Cold</>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Touchpoints */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tpKeys.map(([label, key, val]) => (
              <div key={key} className="relative">
                <button
                  onClick={() => toggleTouchpoint(lead.id, key, val)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                    val
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {label === "WA" ? "WA" : `T${label}`}
                </button>
                {val && (
                  <button
                    onClick={() => setExpandedNotes(prev => ({
                      ...prev,
                      [`${lead.id}_${key}`]: !prev[`${lead.id}_${key}`]
                    }))}
                    className="ml-1 text-[10px] text-neutral-400 hover:text-neutral-600"
                    title={expandedNotes[`${lead.id}_${key}`] ? "Close notes" : "Add notes"}
                  >
                    <MessageSquare className="h-3 w-3 inline" />
                  </button>
                )}
                {expandedNotes[`${lead.id}_${key}`] && (
                  <div className="mt-2 p-2 bg-[#faf8f3] rounded-md border border-[#e8e4db]">
                    <textarea
                      className="w-full text-xs p-2 rounded border border-[#e8e4db] bg-white resize-none focus:outline-none focus:border-gold/50"
                      rows={2}
                      placeholder="Add note about this touchpoint..."
                      defaultValue={lead.touchpoint_notes?.[key] || ""}
                      onChange={(e) => setNoteDrafts(prev => ({ ...prev, [`${lead.id}_${key}`]: e.target.value }))}
                    />
                    <div className="flex justify-end mt-1 gap-1">
                      <button
                        onClick={() => saveNote(lead.id, key)}
                        disabled={savingNote[`${lead.id}_${key}`]}
                        className="px-2 py-0.5 text-[10px] font-medium bg-gold text-white rounded hover:bg-gold/90 disabled:opacity-50"
                      >
                        {savingNote[`${lead.id}_${key}`] ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setExpandedNotes(prev => ({ ...prev, [`${lead.id}_${key}`]: false }))}
                        className="px-2 py-0.5 text-[10px] font-medium text-neutral-500 hover:text-neutral-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {lead.touchpoint_notes?.[key] && (
                      <div className="mt-1 text-[10px] text-neutral-500 italic border-t border-[#e8e4db] pt-1">
                        Last note: {lead.touchpoint_notes[key]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Followup Timeline */}
        <div className="space-y-1.5">
          {pending.map(f => {
            const badge = getStatusBadge(f);
            return (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-[#faf8f3] border border-[#e8e4db]">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[11px] text-neutral-500">{formatDate(f.scheduled_date)}</span>
                  <span className="text-xs">{getTypeIcon(f.type)} {TYPE_LABELS[f.type] || f.type}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                {f.status === "pending" && f.type !== "arrival" && (
                  <button
                    onClick={() => markDone(lead.id, f.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700 px-2 py-1 rounded-md hover:bg-green-50 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </button>
                )}
                {f.type === "arrival" && f.status === "pending" && (
                  <button
                    onClick={() => markArrived(lead.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSection(title: string, icon: React.ReactNode, leads: Lead[], accentColor: string) {
    if (leads.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          {icon}
          <h3 className="text-lg font-bold text-[#1a1a1a]">{title}</h3>
          <span className={"inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-white text-[11px] font-bold " + accentColor}>
            {leads.length}
          </span>
        </div>
        <div className="space-y-4">
          {sortLeads(leads).map(lead => renderLeadCard(lead))}
        </div>
      </div>
    );
  }

  if (loading) return <FollowupCardSkeleton count={3} />;
  if (error) return (
    <div className="p-12 text-center">
      <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
      <p className="text-neutral-500">{error}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Follow-ups</h2>
        <p className="text-sm text-neutral-500 mt-1">Track and manage all pending follow-ups with your clients.</p>
      </div>

      {renderSection("Hot Leads", <Flame className="h-5 w-5 text-red-500" />, hotLeads, "bg-red-500")}
      {renderSection("Cold Leads", <Snowflake className="h-5 w-5 text-blue-500" />, coldLeads, "bg-blue-500")}
      {otherLeads.length > 0 && renderSection("Other", <Clock className="h-5 w-5 text-neutral-500" />, otherLeads, "bg-neutral-500")}

      {leads.length === 0 && !loading && (
        <div className="text-center py-20">
          <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-neutral-400 mb-1">No Pending Followups</p>
          <p className="text-sm text-neutral-400">Clients with upcoming appointments will appear here.</p>
        </div>
      )}
    </div>
  );
}
