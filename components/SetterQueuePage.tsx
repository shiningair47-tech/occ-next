"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Search, PhoneOutgoing, PhoneCall,
  PhoneMissed, Target, ListChecks, CircleCheck, Flag, Users, Send, Clock,
  Package, Boxes, Download, PackagePlus, Inbox, CircleDashed, ThumbsDown,
  PhoneOff, Circle, Copy, Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { Lead } from "@/types";
interface Batch { id: string; label: string; source: string; lead_count: number; assigned_at: string; uploaded_by: string; }

function formatDate(d: Date) { return d.toISOString().slice(0, 10); }
function todayStr() { return formatDate(new Date()); }
function labelDate(s: string) {
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch { return s; }
}

function SetterStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    pending: "bg-neutral-100 text-neutral-700 border-neutral-200",
    qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    appointment_fixed: "bg-gold/10 text-gold-dark border-gold/30",
    bad: "bg-red-50 text-red-700 border-red-200",
    wrong_number: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = { pending: "Pending", qualified: "Qualified", appointment_fixed: "Appt Fixed", bad: "Bad Lead", wrong_number: "Wrong #" };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${cfg[status] ?? cfg.pending}`}>{labels[status] ?? status}</span>;
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center mb-4">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5 tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</p>
    </div>
  );
}

export default function SetterQueuePage({ userName, userTeam }: { userName: string; userTeam: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [dateSearch, setDateSearch] = useState("");
  const [dateSearchError, setDateSearchError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [requestReason, setRequestReason] = useState("Leads exhausted");
  const [requestCount, setRequestCount] = useState("10");
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [fixingApptLeadId, setFixingApptLeadId] = useState<string | null>(null);
  const [dataRequests, setDataRequests] = useState<{ id: string; requested_count: number; reason: string; status: string; requested_day: string; created_at: string; fulfilled_at: string; fulfilled_count: number; admin_note: string; }[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const REASONS = ["Leads exhausted", "Quality issues", "Wrong numbers", "Request additional data"];

  const load = useCallback(async () => {
    const [lr, rr] = await Promise.all([
      fetch("/api/leads?scope=setter_queue"),
      fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_data_requests" }) }),
    ]);
    if (lr.ok) { const d = await lr.json(); setLeads(d.leads ?? []); setBatches(d.batches ?? []); }
    if (rr.ok) { const d = await rr.json(); setDataRequests(d.requests ?? []); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, leadId: string, extra?: Record<string, unknown>) {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, leadId, ...extra }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Action failed"); return; }
    await load();
  }

  async function submitRequest() {
    setRequestError(""); setRequestSuccess("");
    const count = parseInt(requestCount);
    if (!count || count < 1) { setRequestError("Enter a valid number of leads."); return; }
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_data_request", reason: requestReason, requestedCount: count }),
    });
    if (!res.ok) { setRequestError("Failed to submit request."); return; }
    setRequestSuccess(`Replacement data request submitted for ${selectedDate}.`);
    await load();
  }

  function shiftDate(delta: number) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  }

  const isToday = selectedDate === todayStr();
  const dayLeads = leads.filter(l => filter === "all" || l.setter_status === filter);
  const totalLeads = leads.length;
  const pendingLeads = leads.filter(l => l.setter_status === "pending").length;
  const qualifiedLeads = leads.filter(l => l.setter_status === "qualified").length;
  const badLeads = leads.filter(l => l.setter_status === "bad" || l.setter_status === "wrong_number").length;
  const calledToday = leads.filter(l => l.called_dates?.includes(selectedDate)).length;
  const totalCalled = leads.filter(l => (l.called_dates?.length ?? 0) > 0).length;
  const progressPct = totalLeads > 0 ? Math.round((calledToday / totalLeads) * 100) : 0;
  const qualRate = totalLeads > 0 ? `${Math.round((qualifiedLeads / totalLeads) * 100)}%` : "0%";
  const pairedCloser = leads.length > 0 ? leads[0].closer : "";
  const pairLabel = userTeam || "";

  const todayBatches = batches.filter(b => b.assigned_at?.startsWith(selectedDate));
  const openRequests = dataRequests.filter(r => r.status === "pending").length;
  const fulfilledRequests = dataRequests.filter(r => r.status === "fulfilled").length;

  return (
    <div>
      {/* Date tracker */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-gold" />
            </div>
            <div>
              <div className="flex items-center">
                <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-dark">DAILY CALLING TRACKER</p>
                {isToday && <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase border bg-gold/10 text-gold-dark border-gold/30 ml-2">TODAY</span>}
              </div>
              <p className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mt-0.5">{labelDate(selectedDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="h-9 w-9 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:border-[#1a1a1a] hover:text-[#1a1a1a] flex items-center justify-center transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => setSelectedDate(todayStr())} className="h-9 px-3 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] transition-colors text-xs font-semibold">Today</button>
            <button onClick={() => shiftDate(1)} className="h-9 w-9 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:border-[#1a1a1a] hover:text-[#1a1a1a] flex items-center justify-center transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">JUMP TO DAY</p>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input value={dateSearch} onChange={e => setDateSearch(e.target.value)} placeholder="Try '29 May', '3rd Mar', or '2025-05-29'"
                className="w-full pl-9 pr-3 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
          <div className="w-full md:w-56">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">OR PICK A DATE</p>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
          </div>
        </div>
        {dateSearchError && <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md"><Search className="h-3.5 w-3.5 text-amber-700" /><p className="text-[11px] text-amber-900 font-medium">{dateSearchError}</p></div>}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">PROGRESS</span>
            <span className="text-[11px] font-bold text-[#1a1a1a]">{calledToday} / {totalLeads} calls</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Batches */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center"><Boxes className="h-4 w-4 text-gold" /></div>
            <div>
              <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Today&apos;s Assigned Batches</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Lead batches assigned to you for the selected day.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[11px] font-semibold transition-colors">
              <Download className="h-3.5 w-3.5" /><span>Day CSV</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-gold text-[11px] font-semibold transition-colors">
              <Download className="h-3.5 w-3.5" /><span>All My Leads</span>
            </button>
          </div>
        </div>
        {todayBatches.length > 0 ? (
          <div className="flex flex-col gap-3">
            {todayBatches.map(b => (
              <div key={b.id} className="flex items-start justify-between gap-3 bg-white border border-neutral-200 rounded-lg p-4 hover:border-gold/40 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0"><Package className="h-3.5 w-3.5 text-gold" /></div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a1a1a]">{b.label}</p>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-[#faf8f3] text-neutral-600 border-neutral-200">{b.source}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Assigned {b.assigned_at?.slice(0, 10)} by {b.uploaded_by}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-8 text-center">
            <PackagePlus className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-700">No batches assigned for this day</p>
            <p className="text-xs text-neutral-500 mt-1">Switch days using the tracker above, or wait for your admin to assign new data.</p>
          </div>
        )}
      </div>

      {/* Data request */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0"><PackagePlus className="h-4 w-4 text-gold" /></div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-dark">REPLACEMENT DATA REQUEST</p>
            <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mt-0.5">Need more leads?</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Request additional data from your admin when your assigned leads are exhausted or unusable.</p>
          </div>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">REASON</p>
            <div className="relative">
              <select value={requestReason} onChange={e => setRequestReason(e.target.value)}
                className="appearance-none w-full px-3 py-2.5 pr-8 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-32">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">HOW MANY LEADS</p>
            <input type="number" min="1" max="200" value={requestCount} onChange={e => setRequestCount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none" />
          </div>
          <div className="w-full md:w-44">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">FOR DAY</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-neutral-200 bg-[#faf8f3] h-[42px]">
              <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
              <span className="text-xs font-mono font-semibold text-[#1a1a1a]">{selectedDate}</span>
            </div>
          </div>
          <button onClick={submitRequest}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] transition-colors h-[42px] shrink-0">
            <Send className="h-3.5 w-3.5" /><span className="text-xs font-semibold tracking-wide">Submit Request</span>
          </button>
        </div>
        {requestError && <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md"><span className="text-xs text-red-700 font-medium">{requestError}</span></div>}
        {requestSuccess && <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md"><span className="text-xs text-emerald-800 font-medium">{requestSuccess}</span></div>}
        <div className="mt-5 pt-5 border-t border-neutral-200">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full">
              <span className="h-2 w-2 rounded-full bg-amber-500" /><span className="text-sm font-bold text-[#1a1a1a] font-['Adorn_Condensed','Halis','Inter',sans-serif]">{openRequests}</span>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">OPEN</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-sm font-bold text-[#1a1a1a] font-['Adorn_Condensed','Halis','Inter',sans-serif]">{fulfilledRequests}</span>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">FULFILLED</span>
            </div>
          </div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">MY REQUEST HISTORY</p>
          {dataRequests.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {dataRequests.map(r => (
                <div key={r.id} className="flex items-start justify-between gap-3 bg-white border border-neutral-200 rounded-lg p-3 hover:border-gold/30 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0"><PackagePlus className="h-3.5 w-3.5 text-gold" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#1a1a1a]">{r.requested_count} lead(s)</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-xs text-neutral-700">{r.reason}</span>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border w-fit ${r.status === "fulfilled" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {r.status === "fulfilled" ? "Fulfilled" : "Awaiting Admin"}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-neutral-500">For {r.requested_day} · submitted {r.created_at?.slice(0, 10)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-6 text-center">
              <Inbox className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-500 font-medium">No replacement requests yet</p>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="CALLS DUE" value={String(totalLeads)} icon={PhoneOutgoing} />
        <Kpi label="COMPLETED" value={String(calledToday)} icon={PhoneCall} />
        <Kpi label="REMAINING" value={String(totalLeads - calledToday)} icon={PhoneMissed} />
        <Kpi label="QUAL RATE" value={qualRate} icon={Target} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="PENDING" value={String(pendingLeads)} icon={ListChecks} />
        <Kpi label="QUALIFIED" value={String(qualifiedLeads)} icon={CircleCheck} />
        <Kpi label="FLAGGED" value={String(badLeads)} icon={Flag} />
        <Kpi label="TOTAL" value={String(totalLeads)} icon={Users} />
      </div>

      {/* Queue header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">My Queue</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Work through your assigned leads · click-to-call enabled</p>
          {pairLabel && (
            <div className="flex items-center gap-1.5 mt-2">
              <Users className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-semibold tracking-wide text-[#1a1a1a]">{pairLabel}</span>
              {pairedCloser && <><span className="text-[11px] text-neutral-500"> · Paired with </span><span className="text-[11px] font-semibold text-gold-dark">{pairedCloser}</span></>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[["Pending","pending",pendingLeads],["Qualified","qualified",qualifiedLeads],["All","all",totalLeads]].map(([l,v,c]) => (
            <button key={String(v)} onClick={() => setFilter(String(v))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all text-xs font-medium tracking-wide ${filter === String(v) ? "bg-[#1a1a1a] text-gold border-gold/40" : "bg-white text-neutral-600 border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a]"}`}>
              <span>{l}</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20">{c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Queue rows */}
      {dayLeads.length > 0 ? (
        <div className="flex flex-col gap-3">
          {dayLeads.map(lead => {
            const isCalled = lead.called_dates?.includes(selectedDate);
            return (
              <div key={lead.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-gold/40 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-gold">{lead.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{lead.name}</p>
                        <div className="flex items-center gap-2">
                          {(lead.followups?.filter((f: any) => f.status === "pending" && f.scheduled_date < todayStr()).length ?? 0) > 0 && (
                            <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-red-100 text-red-700 border border-red-300 text-[9px] font-bold">
                              {lead.followups?.filter((f: any) => f.status === "pending" && f.scheduled_date < todayStr()).length} overdue
                            </span>
                          )}
                          <SetterStatusBadge status={lead.setter_status} />
                        </div>
                        {isCalled && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 text-gold-dark border border-gold/30 w-fit">
                            <PhoneCall className="h-3 w-3" /><span className="text-[10px] font-semibold tracking-wide">Called {selectedDate}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-neutral-700 hover:text-gold transition-colors">
                          <Phone className="h-3 w-3" /><span className="text-xs font-medium">{lead.phone}</span>
                        </a>
                        <span className="text-neutral-300">·</span>
                        <span className="text-xs text-neutral-500">{lead.source}</span>
                        {(lead.called_dates?.length ?? 0) > 0 && (
                          <><span className="text-neutral-300">·</span><span className="text-[11px] text-neutral-500">{lead.called_dates.length} call(s)</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => doAction("mark_called", lead.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-semibold transition-colors ${isCalled ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" : "bg-white text-neutral-700 border-neutral-200 hover:border-gold"}`}>
                      {isCalled ? <CircleCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      <span>{isCalled ? "Called" : "Mark Called"}</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(lead.phone); toast.success("Copied!"); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-gold text-xs font-semibold transition-colors">
                      <Copy className="h-3.5 w-3.5" /><span>Copy</span>
                    </button>
                    <a href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] transition-colors text-xs font-semibold">
                      <PhoneCall className="h-3.5 w-3.5" /><span>Call</span>
                    </a>
                  </div>
                </div>
                <input defaultValue={lead.notes} placeholder="Add a note (e.g., callback at 5pm, interested in Canada)"
                  onBlur={e => doAction("update_notes", lead.id, { notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 bg-[#faf8f3] text-xs text-[#1a1a1a] placeholder-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20" />
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {[
                    { label: "Qualified", status: "qualified", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100", icon: CircleCheck },
                    { label: "Appt Fixed", status: "appointment_fixed", cls: "bg-gold/10 text-gold-dark border border-gold/30 hover:bg-gold/20", icon: CalendarDays },
                    { label: "Bad", status: "bad", cls: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100", icon: ThumbsDown },
                    { label: "Wrong #", status: "wrong_number", cls: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100", icon: PhoneOff },
                    { label: "Pending", status: "pending", cls: "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200", icon: CircleDashed },
                  ].map(({ label, status, cls, icon: Icon }) => (
                    <button key={status} onClick={() => {
                          if (status === "appointment_fixed") {
                            setFixingApptLeadId(lead.id);
                          } else {
                            doAction("qualify_lead", lead.id, { status });
                          }
                        }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${cls}`}>
                      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
                    </button>
                  ))}
                </div>
                {fixingApptLeadId === lead.id && (
                  <div className="mt-3 mb-3">
                    <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">SELECT APPOINTMENT DATE</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 ">
                      {Array.from({ length: 14 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const day = d.getDate();
                        const s = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
                        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                        const label = `${day}${s} ${months[d.getMonth()]}`;
                        const val = d.toISOString().slice(0, 10);
                        return (
                          <button key={i} onClick={async () => {
                            await doAction("set_appointment", lead.id, { date: val });
                            await doAction("qualify_lead", lead.id, { status: "appointment_fixed" });
                            setFixingApptLeadId(null);
                          }}
                            className="shrink-0 px-3 py-2 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap bg-white text-neutral-600 border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a]">
                            {label}
                          </button>
                        );
                      })}
                      <button onClick={() => setFixingApptLeadId(null)}
                        className="shrink-0 px-3 py-2 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                                {(lead.setter_status === "qualified" || lead.setter_status === "appointment_fixed") && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gold/30">
                    <div className="flex items-start gap-2 mb-2">
                      <Send className="h-3.5 w-3.5 text-gold shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.25em] text-gold-dark">HANDOFF TO CLOSER</p>
                        <p className="text-[11px] text-neutral-600 mt-0.5">{lead.closer ? `Send to ${lead.closer}` : "No closer paired with your team"}</p>
                      </div>
                    </div>
                    {lead.handoff_status === "pending" ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                        <Clock className="h-3 w-3 text-amber-700" /><span className="text-[10px] text-amber-900 font-semibold">Handed off {lead.handoff_at}</span>
                      </div>
                    ) : lead.handoff_status === "accepted" ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
                        <CircleCheck className="h-3 w-3 text-emerald-700" /><span className="text-[10px] text-emerald-900 font-semibold">Accepted by closer · {lead.accepted_at}</span>
                      </div>
                    ) : (
                      <button onClick={() => doAction("handoff_lead", lead.id)} disabled={!lead.closer}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-semibold transition-colors ${lead.closer ? "bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a]" : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"}`}>
                        <Send className="h-3.5 w-3.5" /><span>Hand off to Closer</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 text-center">
          <Inbox className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-500">No leads match this filter</p>
        </div>
      )}
    </div>
  );
}



