"use client";
import { useState, useEffect, useCallback } from "react";
import { UserX, Zap, PackagePlus, CircleAlert, CircleCheck, Inbox, ShieldCheck, Hand, RotateCcw, ScanLine, Sparkles, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { parsePaste, ParsedLead } from "@/lib/parsePaste";

interface Replacement {
  id: string; lead_name: string; reason: string; setter: string; pair: string;
  status: string; created_at: string; auto_fulfilled: boolean; fulfilled_at: string;
  fulfillment_note: string; replacement_name: string; replacement_phone: string;
  replacement_source: string; pool_entry_id: string;
}
interface DataRequest {
  id: string; setter: string; team: string; requested_count: number; reason: string;
  status: string; requested_day: string; created_at: string; fulfilled_at: string;
  fulfilled_count: number; admin_note: string;
}
interface PoolEntry {
  id: string; name: string; phone: string; source: string; status: string;
  added_by: string; added_at: string; assigned_to_pair: string;
}

const SOURCE_OPTIONS = ["Facebook","Instagram","Google Ads","Referral","WhatsApp","TikTok","Walk-in","Other"];


function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center mb-4"><Icon className="h-4 w-4 text-gold" /></div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5 tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</p>
    </div>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  if (reason === "wrong_number") return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-red-50 text-red-700 border-red-200 w-fit">Wrong Number</span>;
  return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-amber-50 text-amber-700 border-amber-200 w-fit">Bad Lead</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "open") return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-amber-50 text-amber-700 border-amber-200 w-fit">Needs Data</span>;
  return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">Fulfilled</span>;
}

function RequestStatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-neutral-200 text-neutral-600 border-neutral-300",
  };
  const l: Record<string, string> = { pending: "Open", fulfilled: "Fulfilled", cancelled: "Cancelled" };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border w-fit ${m[status] ?? m.pending}`}>{l[status] ?? status}</span>;
}

function FilterPill({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium tracking-wide ${active ? "bg-[#1a1a1a] text-gold border-gold/40" : "bg-white text-neutral-600 border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a]"}`}>
      <span>{label}</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20">{count}</span>
    </button>
  );
}

export default function ReplacementsPage() {
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [pool, setPool] = useState<PoolEntry[]>([]);
  const [repFilter, setRepFilter] = useState("all");
  const [poolFilter, setPoolFilter] = useState("available");
  const [reqFilter, setReqFilter] = useState("pending");

  // Fulfillment form state
  const [activeReqId, setActiveReqId] = useState("");
  const [fulfillNote, setFulfillNote] = useState("");
  const [fulfillCount, setFulfillCount] = useState("0");

  // Pool paste state
  const [poolPaste, setPoolPaste] = useState("");
  const [poolParsed, setPoolParsed] = useState<ParsedLead[]>([]);
  const [poolSource, setPoolSource] = useState(SOURCE_OPTIONS[0]);
  const [poolError, setPoolError] = useState("");
  const [poolConfirm, setPoolConfirm] = useState("");

  const load = useCallback(async () => {
    const [rr, dr, pr] = await Promise.all([
      fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_replacements" }) }),
      fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_data_requests" }) }),
      fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_pool" }) }),
    ]);
    if (rr.ok) { const d = await rr.json(); setReplacements(d.replacements ?? []); }
    if (dr.ok) { const d = await dr.json(); setDataRequests(d.requests ?? []); }
    if (pr.ok) { const d = await pr.json(); setPool(d.pool ?? []); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function fulfillRequest(reqId: string) {
    const res = await fetch("/api/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fulfill_data_request", requestId: reqId, adminNote: fulfillNote, fulfilledCount: parseInt(fulfillCount) || 0 }),
    });
    if (!res.ok) { toast.error("Failed to fulfill"); return; }
    toast.success("Request fulfilled");
    setActiveReqId(""); setFulfillNote(""); setFulfillCount("0");
    await load();
  }

  async function fulfillReplacement(repId: string) {
    const avail = pool.filter(p => p.status === "available");
    if (!avail.length) { toast.error("No pool entries available"); return; }
    const res = await fetch("/api/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fulfill_replacement", replacementId: repId, poolEntryId: avail[0].id, note: "Auto-fulfilled from pool" }),
    });
    if (!res.ok) { toast.error("Failed to fulfill"); return; }
    toast.success("Replacement fulfilled");
    await load();
  }

  function handlePoolParse() {
    setPoolError(""); setPoolConfirm("");
    const parsed = parsePaste(poolPaste);
    if (!parsed.length) { setPoolError("No valid leads found. Each line needs a phone number."); return; }
    setPoolParsed(parsed);
  }

  async function handlePoolConfirm() {
    setPoolError(""); setPoolConfirm("");
    for (const p of poolParsed) {
      await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_to_pool", name: p.name, phone: p.phone, source: poolSource }) });
    }
    setPoolConfirm(`Added ${poolParsed.length} lead(s) to the replacement pool.`);
    setPoolParsed([]); setPoolPaste("");
    toast.success("Pool updated");
    await load();
  }

  // Derived
  const openReps = replacements.filter(r => r.status === "open").length;
  const autoFulfilled = replacements.filter(r => r.status === "fulfilled" && r.auto_fulfilled).length;
  const manualFulfilled = replacements.filter(r => r.status === "fulfilled" && !r.auto_fulfilled).length;
  const filteredReps = replacements.filter(r => repFilter === "all" || r.status === repFilter);

  const openReqs = dataRequests.filter(r => r.status === "pending").length;
  const fulfilledReqs = dataRequests.filter(r => r.status === "fulfilled").length;
  const cancelledReqs = dataRequests.filter(r => r.status === "cancelled").length;
  const totalDelivered = dataRequests.filter(r => r.status === "fulfilled").reduce((s, r) => s + (r.fulfilled_count || 0), 0);
  const filteredReqs = dataRequests.filter(r => reqFilter === "all" || r.status === reqFilter);

  const availPool = pool.filter(p => p.status === "available").length;
  const assignedPool = pool.filter(p => p.status === "assigned").length;
  const filteredPool = pool.filter(p => poolFilter === "all" || p.status === poolFilter);

  // Group replacements by setter
  const bySetterMap: Record<string, { open: number; fulfilled: number; total: number }> = {};
  for (const r of replacements) {
    if (!bySetterMap[r.setter]) bySetterMap[r.setter] = { open: 0, fulfilled: 0, total: 0 };
    bySetterMap[r.setter].total++;
    if (r.status === "open") bySetterMap[r.setter].open++;
    else bySetterMap[r.setter].fulfilled++;
  }
  const bySetterList = Object.entries(bySetterMap).map(([setter, c]) => ({ setter, ...c }));

  return (
    <div>
      {/* === DATA REQUESTS SECTION === */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center"><PackagePlus className="h-4 w-4 text-gold" /></div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Setter Data Requests</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Review and fulfill replacement-data requests submitted by setters.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi label="OPEN" value={openReqs} icon={CircleAlert} />
          <Kpi label="FULFILLED" value={fulfilledReqs} icon={CircleCheck} />
          <Kpi label="CANCELLED" value={cancelledReqs} icon={UserX} />
          <Kpi label="TOTAL DELIVERED" value={totalDelivered} icon={PackagePlus} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <FilterPill label="Open" active={reqFilter === "pending"} count={openReqs} onClick={() => setReqFilter("pending")} />
          <FilterPill label="Fulfilled" active={reqFilter === "fulfilled"} count={fulfilledReqs} onClick={() => setReqFilter("fulfilled")} />
          <FilterPill label="Cancelled" active={reqFilter === "cancelled"} count={cancelledReqs} onClick={() => setReqFilter("cancelled")} />
          <FilterPill label="All" active={reqFilter === "all"} count={dataRequests.length} onClick={() => setReqFilter("all")} />
        </div>
        {filteredReqs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredReqs.map(r => (
              <div key={r.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3 bg-white border border-neutral-200 rounded-lg p-4 hover:border-gold/40 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0"><PackagePlus className="h-4 w-4 text-gold" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{r.requested_count} lead(s)</p>
                        <RequestStatusBadge status={r.status} />
                        <span className="text-[10px] text-neutral-600 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">{r.reason}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                        <span className="text-neutral-400">Setter:</span><span className="text-[#1a1a1a] font-semibold">{r.setter}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-neutral-400">Team:</span><span className="text-gold-dark font-semibold">{r.team}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-neutral-400">Day:</span><span className="font-mono text-neutral-700">{r.requested_day}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-neutral-400">submitted {r.created_at?.slice(0, 10)}</span>
                      </div>
                      {r.status === "fulfilled" && (
                        <div className="flex items-start gap-2 mt-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
                          <CircleCheck className="h-3 w-3 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-1 flex-wrap text-[11px]">
                              <span className="font-semibold text-emerald-900">Delivered {r.fulfilled_count} lead(s)</span>
                              <span className="text-neutral-300">·</span>
                              <span className="text-emerald-800">at {r.fulfilled_at?.slice(0, 10)}</span>
                            </div>
                            {r.admin_note && <p className="text-[10px] text-emerald-900 mt-0.5">{r.admin_note}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {r.status === "pending" && (
                    activeReqId === r.id ? (
                      <button onClick={() => setActiveReqId("")} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 text-[11px] font-semibold transition-colors shrink-0">
                        Close Form
                      </button>
                    ) : (
                      <button onClick={() => { setActiveReqId(r.id); setFulfillCount(String(r.requested_count)); }} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[11px] font-semibold transition-colors shrink-0">
                        Fulfill
                      </button>
                    )
                  )}
                </div>
                {activeReqId === r.id && r.status === "pending" && (
                  <div className="mt-2 p-4 bg-[#faf8f3] border border-gold/30 rounded-md">
                    <div className="flex items-end gap-3 flex-wrap mb-3">
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">ADMIN NOTE (OPTIONAL)</p>
                        <input type="text" value={fulfillNote} onChange={e => setFulfillNote(e.target.value)} placeholder="e.g. Fresh batch from Meta campaign"
                          className="w-full px-3 py-2 rounded-md border border-neutral-200 bg-white text-xs text-[#1a1a1a] focus:border-gold focus:outline-none" />
                      </div>
                      <div className="w-32">
                        <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">LEADS DELIVERED</p>
                        <input type="number" min="0" value={fulfillCount} onChange={e => setFulfillCount(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-neutral-200 bg-white text-xs text-[#1a1a1a] focus:border-gold focus:outline-none" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => fulfillRequest(r.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors">
                        <CircleCheck className="h-3.5 w-3.5" /><span>Mark as Fulfilled</span>
                      </button>
                      <button onClick={() => setActiveReqId("")} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 text-[11px] font-semibold transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 text-center">
            <Inbox className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-500">No requests in this view</p>
          </div>
        )}
      </div>

      {/* === POOL SECTION === */}
      <div className="mb-8">
        <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center"><PackagePlus className="h-4 w-4 text-gold" /></div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-dark">REPLACEMENT POOL</p>
              <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mt-0.5">Add leads to pool</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Paste replacement leads below — one per line with a phone number. They&apos;ll be used to auto-fulfill replacement requests.</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">PASTE LEADS</p>
              <button onClick={() => { setPoolPaste("Replacement Lead — +91 98000 11111\nSpare Contact - +91 99001 22233"); setPoolParsed([]); setPoolError(""); setPoolConfirm(""); }}
                className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] font-semibold text-gold-dark hover:text-[#1a1a1a] transition-colors">
                <Sparkles className="h-3 w-3" /><span>Load sample</span>
              </button>
            </div>
            <textarea value={poolPaste} onChange={e => { setPoolPaste(e.target.value); setPoolParsed([]); setPoolError(""); setPoolConfirm(""); }}
              placeholder="Replacement Lead — +91 98000 11111&#10;Spare Contact - +91 99001 22233"
              className="w-full h-32 px-4 py-3 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] font-mono leading-relaxed focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none" />
          </div>
          <div className="flex items-end gap-3 flex-wrap mb-3">
            <div className="flex-1 min-w-[180px]">
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">SOURCE TAG</p>
              <div className="relative">
                <select value={poolSource} onChange={e => setPoolSource(e.target.value)}
                  className="appearance-none w-full px-3 py-2.5 pr-8 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none">
                  {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePoolParse} className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#1a1a1a] text-gold text-sm font-semibold border border-gold/40 hover:bg-[#2a2a2a] transition-colors">
                <ScanLine className="h-4 w-4" /><span>Parse</span>
              </button>
              <button onClick={() => { setPoolPaste(""); setPoolParsed([]); setPoolError(""); setPoolConfirm(""); }}
                className="px-4 py-2.5 rounded-md bg-white text-neutral-600 text-sm font-medium border border-neutral-200 hover:border-neutral-400 transition-colors">
                Clear
              </button>
            </div>
          </div>
          {poolError && (
            <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
              <CircleAlert className="h-4 w-4 text-red-600 shrink-0" /><p className="text-xs text-red-700 font-medium">{poolError}</p>
            </div>
          )}
          {poolParsed.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a1a] font-['Adorn_Condensed','Halis','Inter',sans-serif]">Preview</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{poolParsed.length} new lead(s) ready to add to the pool</p>
                </div>
                <button onClick={handlePoolConfirm} className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                  <CircleCheck className="h-4 w-4" /><span>Add to Pool</span>
                </button>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <table className="table-auto w-full">
                  <thead><tr className="bg-[#faf8f3] border-b border-neutral-200">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase w-12">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">Phone</th>
                  </tr></thead>
                  <tbody>
                    {poolParsed.map((p, i) => (
                      <tr key={i} className="border-b border-neutral-100">
                        <td className="px-4 py-2.5 text-xs text-neutral-400">{i + 1}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-[#1a1a1a]">{p.name}</td>
                        <td className="px-4 py-2.5 text-sm text-neutral-700 font-mono">{p.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {poolConfirm && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
              <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" /><p className="text-xs text-emerald-900 font-medium">{poolConfirm}</p>
            </div>
          )}
        </div>

        {/* Pool entries list */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Pool Entries</h3>
              <p className="text-xs text-neutral-500 mt-0.5">All replacement leads in the data pool</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FilterPill label="Available" active={poolFilter === "available"} count={availPool} onClick={() => setPoolFilter("available")} />
              <FilterPill label="Assigned" active={poolFilter === "assigned"} count={assignedPool} onClick={() => setPoolFilter("assigned")} />
              <FilterPill label="All" active={poolFilter === "all"} count={pool.length} onClick={() => setPoolFilter("all")} />
            </div>
          </div>
          {filteredPool.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredPool.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-3 hover:border-gold/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gold">{p.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{p.name}</p>
                        <span className="text-xs text-neutral-500 font-mono">{p.phone}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border w-fit ${p.status === "available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-neutral-100 text-neutral-600 border-neutral-200"}`}>{p.status}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Added by {p.added_by} · {p.source} · {p.added_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 text-center">
              <p className="text-sm font-medium text-neutral-500">{pool.length === 0 ? "The replacement pool is empty" : "No entries match this filter"}</p>
              <p className="text-xs text-neutral-400 mt-1">Paste replacement lead data above to start building your pool.</p>
            </div>
          )}
        </div>
      </div>

      {/* === REPLACEMENT QUEUE === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="NEEDS DATA" value={openReps} icon={CircleAlert} />
        <Kpi label="AUTO-FULFILLED" value={autoFulfilled} icon={Zap} />
        <Kpi label="MANUAL" value={manualFulfilled} icon={Hand} />
        <Kpi label="TOTAL" value={replacements.length} icon={RotateCcw} />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Replacement Queue</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Bad leads and wrong numbers awaiting replacement</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill label="Open" active={repFilter === "open"} count={openReps} onClick={() => setRepFilter("open")} />
          <FilterPill label="Fulfilled" active={repFilter === "fulfilled"} count={replacements.length - openReps} onClick={() => setRepFilter("fulfilled")} />
          <FilterPill label="All" active={repFilter === "all"} count={replacements.length} onClick={() => setRepFilter("all")} />
        </div>
      </div>

      {replacements.length > 0 ? (
        <div>
          {bySetterList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold tracking-[0.25em] text-neutral-400 uppercase mb-3">Grouped by Setter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {bySetterList.map(g => (
                  <div key={g.setter} className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#1a1a1a] flex items-center justify-center"><UserX className="h-3.5 w-3.5 text-gold" /></div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{g.setter}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{g.total} total requests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-center"><p className="text-lg font-bold text-amber-700 font-['Adorn_Condensed','Halis','Inter',sans-serif]">{g.open}</p><p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400">OPEN</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-emerald-700 font-['Adorn_Condensed','Halis','Inter',sans-serif]">{g.fulfilled}</p><p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400">DONE</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <h3 className="text-xs font-semibold tracking-[0.25em] text-neutral-400 uppercase mb-3">Audit Trail</h3>
          <div className="flex flex-col gap-3">
            {filteredReps.map(r => (
              <div key={r.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-gold/40 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0"><UserX className="h-4 w-4 text-gold" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{r.lead_name}</p>
                        <ReasonBadge reason={r.reason} />
                        <StatusBadge status={r.status} />
                        {r.status === "fulfilled" && (
                          r.auto_fulfilled
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-gold/10 text-gold-dark border-gold/30 w-fit"><Zap className="h-3 w-3" /><span>Auto</span></span>
                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-blue-50 text-blue-700 border-blue-200 w-fit"><Hand className="h-3 w-3" /><span>Manual</span></span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        <span className="text-neutral-400">Flagged by </span><span className="text-neutral-700 font-medium">{r.setter}</span>
                        <span className="text-neutral-300"> · </span><span className="text-neutral-700 font-medium">{r.pair}</span>
                        <span className="text-neutral-300"> · </span><span className="text-neutral-400">{r.created_at?.slice(0, 10)}</span>
                      </p>
                    </div>
                  </div>
                  {r.status === "open" && (
                    <button onClick={() => fulfillReplacement(r.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors shrink-0">
                      <Zap className="h-3.5 w-3.5" /><span>Fulfill from Pool</span>
                    </button>
                  )}
                </div>
                {r.status === "fulfilled" ? (
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <CircleCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-900">{r.fulfillment_note}</p>
                        {r.replacement_phone && (
                          <div className="flex items-center gap-1 flex-wrap mt-1 text-[10px]">
                            <span className="text-neutral-500">Replacement:</span>
                            <span className="font-semibold text-[#1a1a1a]">{r.replacement_name}</span>
                            <span className="text-neutral-300">·</span>
                            <span className="font-mono text-neutral-700">{r.replacement_phone}</span>
                            <span className="text-neutral-300">·</span>
                            <span className="text-neutral-600">{r.replacement_source}</span>
                            <span className="text-neutral-400">· transferred at {r.fulfilled_at?.slice(0, 10)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                    <CircleAlert className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">Awaiting pool data — add leads to the replacement pool above to fulfill this request.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700">No replacement requests yet</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">Setters trigger requests automatically when they flag bad leads or wrong numbers.</p>
        </div>
      )}
    </div>
  );
}




