"use client";
import { useState, useEffect, useCallback } from "react";
import { GitBranch, Flame, PlaneLanding, X, Inbox, Phone, Copy, CircleCheck, RotateCcw, Calendar, Snowflake, Users, Download, Boxes } from "lucide-react";
import toast from "react-hot-toast";
import { Lead } from "@/types";

function CloserStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    new: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "New" },
    hot: { cls: "bg-red-50 text-red-700 border-red-200", label: "Hot" },
    cold: { cls: "bg-neutral-100 text-neutral-700 border-neutral-200", label: "Cold" },
    arrived: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Arrived" },
    lost: { cls: "bg-neutral-200 text-neutral-600 border-neutral-300", label: "Lost" },
  };
  const c = cfg[status] ?? { cls: "bg-neutral-100 text-neutral-700 border-neutral-200", label: status };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border w-fit ${c.cls}`}>{c.label}</span>;
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center mb-4"><Icon className="h-4 w-4 text-gold" /></div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5 tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</p>
    </div>
  );
}

export default function CloserPipelinePage({ userName, userTeam }: { userName: string; userTeam: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/leads?scope=closer_pipeline");
    if (res.ok) { const d = await res.json(); setLeads(d.leads ?? []); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, leadId: string, extra?: Record<string, unknown>) {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, leadId, ...extra }),
    });
    await load();
  }

  async function toggleTouchpoint(leadId: string, key: string, current: boolean) {
    await doAction("update_touchpoints", leadId, { touchpoint: `t${key}`, value: !current });
  }

  const filteredLeads = leads.filter(l => filter === "all" || l.closer_status === filter);
  const intakeLeads = leads.filter(l => l.handoff_status === "pending" && l.closer_status === "");
  const pipelineLeads = filteredLeads.filter(l => l.handoff_status === "accepted");

  const total = pipelineLeads.length;
  const hot = leads.filter(l => l.closer_status === "hot").length;
  const arrived = leads.filter(l => l.closer_status === "arrived").length;
  const lost = leads.filter(l => l.closer_status === "lost").length;
  const pairedSetter = leads.length > 0 ? leads[0].setter : "";

  const FILTERS = [
    { label: "All", value: "all" }, { label: "New", value: "new" }, { label: "Hot", value: "hot" },
    { label: "Cold", value: "cold" }, { label: "Arrived", value: "arrived" }, { label: "Lost", value: "lost" },
  ];

  return (
    <div>
      {/* Intake section */}
      {intakeLeads.length > 0 && (
        <div className="bg-[#faf8f3] border border-gold/30 rounded-lg p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center"><Inbox className="h-4 w-4 text-gold" /></div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-dark">INCOMING HANDOFFS</p>
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold text-[#1a1a1a] text-[10px] font-bold">{intakeLeads.length}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">New leads handed off by your setter — accept to add them to your active pipeline.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {intakeLeads.map(lead => (
              <div key={lead.id} className="bg-white border-2 border-gold/40 rounded-lg p-4 hover:border-gold transition-colors shadow-sm">
                <div className="mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-gold">{lead.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{lead.name}</p>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase border bg-gold/10 text-gold-dark border-gold/40 w-fit">NEW HANDOFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-neutral-500 hover:text-gold transition-colors text-xs">{lead.phone}</a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-3 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-[10px] text-neutral-500">From </span>
                    <span className="text-[10px] font-semibold text-[#1a1a1a]">{lead.handoff_by}</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{lead.handoff_at}</span>
                  </div>
                  {lead.handoff_note && (
                    <div className="flex items-start gap-1.5 px-2.5 py-2 bg-[#faf8f3] border border-neutral-200 rounded-md">
                      <p className="text-[11px] text-neutral-700 leading-relaxed italic">{lead.handoff_note}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => doAction("accept_handoff", lead.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 text-[11px] font-semibold transition-colors">
                    <CircleCheck className="h-3.5 w-3.5" /><span>Accept Handoff</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 text-[11px] font-semibold transition-colors">
                    <RotateCcw className="h-3.5 w-3.5" /><span>Send Back</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export bar */}
      <div className="bg-[#faf8f3] border border-neutral-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-gold" />
            <p className="text-xs font-semibold tracking-wide text-[#1a1a1a]">Today&apos;s Assigned Batches</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[10px] font-semibold transition-colors">
              <Download className="h-3 w-3" /><span>Day CSV</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-gold text-[10px] font-semibold transition-colors">
              <Download className="h-3 w-3" /><span>All My Leads</span>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 italic">No batches assigned today. Showing all active pipeline below.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="ACTIVE" value={String(total)} icon={GitBranch} />
        <Kpi label="HOT" value={String(hot)} icon={Flame} />
        <Kpi label="ARRIVED" value={String(arrived)} icon={PlaneLanding} />
        <Kpi label="LOST" value={String(lost)} icon={X} />
      </div>

      {/* Pipeline header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Closer Pipeline</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Track touchpoints, appointments, and outcomes for qualified leads</p>
          {userTeam && (
            <div className="flex items-center gap-1.5 mt-2">
              <Users className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-semibold tracking-wide text-[#1a1a1a]">{userTeam}</span>
              {pairedSetter && <><span className="text-[11px] text-neutral-500"> · Paired with </span><span className="text-[11px] font-semibold text-gold-dark">{pairedSetter}</span></>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-full border transition-all text-xs font-medium tracking-wide ${filter === f.value ? "bg-[#1a1a1a] text-gold border-gold/40" : "bg-white text-neutral-600 border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a]"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline cards */}
      {pipelineLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pipelineLeads.map(lead => (
            <div key={lead.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-gold/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gold">{lead.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{lead.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-neutral-500 hover:text-gold transition-colors text-xs">
                        <Phone className="h-3 w-3" />{lead.phone}
                      </a>
                      <button onClick={() => { navigator.clipboard.writeText(lead.phone); toast.success("Copied!"); }}
                        className="text-neutral-400 hover:text-gold transition-colors"><Copy className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
                <CloserStatusBadge status={lead.closer_status} />
              </div>

              {/* Assigned date */}
              {lead.assigned_date && (
                <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-[#faf8f3] border border-neutral-200 w-fit">
                  <Calendar className="h-3 w-3 text-gold shrink-0" />
                  <span className="text-[10px] text-neutral-500">Assigned </span>
                  <span className="text-[10px] font-mono font-semibold text-[#1a1a1a]">{lead.assigned_date}</span>
                </div>
              )}

              {/* WhatsApp */}
              <div className="pb-3 mb-3 border-b border-neutral-100">
                <button onClick={() => doAction("update_touchpoints", lead.id, { touchpoint: "whatsapp_added", value: !lead.whatsapp_added })}
                  className="flex items-center gap-2 hover:opacity-80">
                  {lead.whatsapp_added ? <CircleCheck className="h-4 w-4 text-emerald-600" /> : <div className="h-4 w-4 rounded-full border-2 border-neutral-300" />}
                  <span className="text-xs font-medium text-neutral-700">WhatsApp Group Added</span>
                </button>
              </div>

              {/* Touchpoints */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">TOUCHPOINTS</p>
                <div className="flex gap-1.5">
                  {([["1","t1",lead.t1],["2","t2",lead.t2],["3","t3",lead.t3],["4","t4",lead.t4],["5","t5",lead.t5],["6","t6",lead.t6]] as [string,string,boolean][]).map(([num, key, active]) => (
                    <button key={key} onClick={() => toggleTouchpoint(lead.id, num, active)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${active ? "bg-[#1a1a1a] text-gold border border-gold/40" : "bg-neutral-50 text-neutral-400 border border-neutral-200 hover:border-[#1a1a1a]"}`}>
                      <span className="text-[10px] font-bold">T{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Appointment */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">APPOINTMENT</p>
                <input type="date" defaultValue={lead.appointment_date}
                  onBlur={e => doAction("set_appointment", lead.id, { date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 bg-[#faf8f3] text-xs text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20" />
              </div>

              {/* Outcome buttons */}
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">PIPELINE STATUS</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "Hot", status: "hot", cls: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100", icon: Flame },
                    { label: "Cold", status: "cold", cls: "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200", icon: Snowflake },
                    { label: "Arrived", status: "arrived", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100", icon: PlaneLanding },
                    { label: "Lost", status: "lost", cls: "bg-neutral-200 text-neutral-700 border border-neutral-300 hover:bg-neutral-300", icon: X },
                  ].map(({ label, status, cls, icon: Icon }) => (
                    <button key={status} onClick={() => doAction("update_closer_status", lead.id, { status })}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${cls}`}>
                      <Icon className="h-3 w-3" /><span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 text-center">
          <Inbox className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-500">No leads in this stage yet</p>
        </div>
      )}
    </div>
  );
}





