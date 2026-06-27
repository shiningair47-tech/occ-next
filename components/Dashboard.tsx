"use client";
import {
  Activity, Target, RefreshCw, TrendingUp, TrendingDown,
  PhoneCall, CircleCheck, ListChecks, GitBranch, Flame,
  CircleAlert,
  Calendar,
} from "lucide-react";
import { ReactNode, useState, useEffect, useCallback } from "react";
import { Lead } from "@/types";

// ---- Helpers ----
function KpiCard({ label, value, change, icon: Icon, positive = true }: {
  label: string; value: string; change: string; icon: React.ElementType; positive?: boolean;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 hover:border-gold/50 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
          positive
            ? "text-emerald-700 bg-emerald-50 border-emerald-100"
            : "text-red-700 bg-red-50 border-red-100"
        }`}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{change}</span>
        </div>
      </div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">{label.toUpperCase()}</p>
      <p className="text-3xl font-bold text-[#1a1a1a] mt-2 tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{title}</h2>
      <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  gold: "bg-gold/10 text-gold-dark border-gold/30",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  gray: "bg-neutral-100 text-neutral-700 border-neutral-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border w-fit ${STATUS_COLORS[color] ?? STATUS_COLORS.gray}`}>
      {label}
    </span>
  );
}

function ProgressRow({ label, value, count, color }: { label: string; value: number; count: string; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-neutral-600">{label}</span>
        <span className="text-xs font-bold text-[#1a1a1a]">{count}</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ---- Admin Dashboard ----
function TeamRow({ name, leads, rate, status, color }: { name: string; leads: string; rate: string; status: string; color: string }) {
  return (
    <tr className="border-b border-neutral-100 hover:bg-[#faf8f3] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-xs font-bold text-gold">{name[0]}</span>
          </div>
          <span className="text-sm font-medium text-[#1a1a1a]">{name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-700">{leads}</td>
      <td className="px-4 py-3 text-sm font-semibold text-[#1a1a1a]">{rate}</td>
      <td className="px-4 py-3"><StatusBadge label={status} color={color} /></td>
    </tr>
  );
}

export function AdminDashboard({ oversight }: { oversight?: ReactNode }) {
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <KpiCard label="Leads in Play" value="1,284" change="+12.4%" icon={Activity} positive />
        <KpiCard label="Qualified Rate" value="32.7%" change="+3.1%" icon={Target} positive />
        <KpiCard label="Replacements Open" value="47" change="-8.2%" icon={RefreshCw} positive />
        <KpiCard label="Arrivals This Week" value="68" change="+18.5%" icon={TrendingUp} positive />
      </div>

      {/* Oversight section (live data injected later) */}
      {oversight}
      {oversight && <div className="h-10" />}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team performance table */}
        <div className="lg:col-span-2">
          <SectionTitle title="Team Performance" subtitle="Conversion across all active teams" />
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <table className="table-auto w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-[#faf8f3]">
                  {["Team","Leads","Conv. Rate","Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TeamRow name="Team Aurora" leads="342" rate="38.2%" status="Excellent" color="green" />
                <TeamRow name="Team Vanguard" leads="298" rate="31.5%" status="On Track" color="gold" />
                <TeamRow name="Team Horizon" leads="256" rate="27.8%" status="On Track" color="gold" />
                <TeamRow name="Team Polaris" leads="211" rate="22.3%" status="Needs Attention" color="amber" />
                <TeamRow name="Team Stellar" leads="177" rate="18.6%" status="Below Target" color="red" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline snapshot */}
        <div>
          <SectionTitle title="Pipeline Snapshot" subtitle="Current lead distribution" />
          <div className="bg-white border border-neutral-200 rounded-lg p-5">
            <ProgressRow label="Pending" count="428" value={72} color="bg-neutral-400" />
            <ProgressRow label="Qualified" count="312" value={55} color="bg-gold" />
            <ProgressRow label="Hot Pipeline" count="184" value={38} color="bg-orange-400" />
            <ProgressRow label="Arrived" count="68" value={18} color="bg-emerald-500" />
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CircleAlert className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-900 font-medium">47 replacement requests awaiting fulfillment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Setter Dashboard ----
function QueueItem({ name, phone, source, time }: { name: string; phone: string; source: string; time: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-100 hover:bg-[#faf8f3] transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-gold">{name[0]}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">{name}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{phone}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge label={source} color="gold" />
        <span className="text-xs text-neutral-400">{time}</span>
      </div>
    </div>
  );
}

export function SetterDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const res = await fetch("/api/leads?scope=setter_queue");
    if (res.ok) { const d = await res.json(); setLeads(d.leads ?? []); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalLeads = leads.length;
  const calledToday = leads.filter(l => l.called_dates?.includes(todayStr)).length;
  const qualifiedToday = leads.filter(l => l.setter_status === "qualified").length;
  const qualRate = totalLeads > 0 ? Math.round((qualifiedToday / totalLeads) * 100) + "%" : "0%";
  const pendingLeads = leads.filter(l => l.setter_status === "pending" || !l.setter_status).length;
  const dailyTarget = 15;
  const dailyPct = Math.min(Math.round((qualifiedToday / dailyTarget) * 100), 100);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <KpiCard label="Called Today" value={String(calledToday)} change="" icon={PhoneCall} positive />
        <KpiCard label="Qualified Today" value={String(qualifiedToday)} change="" icon={CircleCheck} positive />
        <KpiCard label="Qualification Rate" value={qualRate} change="" icon={Target} positive />
        <KpiCard label="Queue Remaining" value={String(pendingLeads)} change="" icon={ListChecks} positive />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionTitle title="Today's Queue" subtitle="Leads assigned to you, ready to call" />
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            {leads.length > 0 ? leads.slice(0, 10).map(l => (
              <QueueItem key={l.id} name={l.name} phone={l.phone} source={l.source || "-"} time={l.assigned_at ? new Date(l.assigned_at).toLocaleString() : "-"} />
            )) : (
              <div className="p-8 text-center">
                <p className="text-sm text-neutral-500">No leads assigned yet</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <SectionTitle title="Daily Target" subtitle="Your performance today" />
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="text-center mb-5">
              <p className="text-4xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{qualifiedToday} / {dailyTarget}</p>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mt-1">QUALIFIED LEADS</p>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: dailyPct + "%" }} />
            </div>
            <p className="text-xs text-neutral-500 mt-3 text-center">{dailyPct}% of daily target reached</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-5 mt-4">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-3">THIS WEEK</p>
            {[["Total Leads", String(totalLeads)],["Called", String(calledToday)],["Qualified", String(qualifiedToday)]].map(([k,v],i,a) => (
              <div key={k} className={`flex justify-between py-2 ${i < a.length-1 ? "border-b border-neutral-100" : ""}`}>
                <span className="text-xs text-neutral-600">{k}</span>
                <span className="text-xs font-bold text-[#1a1a1a]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Closer Dashboard ----
function PipelineCard({ name, phone, status, color, touchpoints, appointmentDate, followups }: {
  name: string; phone: string; status: string; color: string; touchpoints: number;
  appointmentDate?: string; followups?: any[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const hasOverdue = followups?.some((f: any) => f.status === "pending" && f.scheduled_date < today);
  const overdueCount = followups?.filter((f: any) => f.status === "pending" && f.scheduled_date < today).length ?? 0;
  const hasDueToday = followups?.some((f: any) => f.status === "pending" && f.scheduled_date === today);
  const dueTodayCount = followups?.filter((f: any) => f.status === "pending" && f.scheduled_date === today).length ?? 0;
  
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-gold/50 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-gold">{name[0]}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#1a1a1a]">{name}</p>
            {hasOverdue && (
              <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-red-100 text-red-700 border border-red-300 text-[9px] font-bold">
                {overdueCount} overdue
              </span>
            )}
            {hasDueToday && (
              <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold">
                {dueTodayCount} due today
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{phone}</p>
        </div>
        <StatusBadge label={status} color={color} />
      </div>
      <div className="pt-3 border-t border-neutral-100">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">TOUCHPOINTS</p>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`h-7 w-7 rounded-full flex items-center justify-center ${
              i < touchpoints
                ? "bg-[#1a1a1a] text-gold border border-gold/40"
                : "bg-neutral-50 text-neutral-300 border border-neutral-200"
            }`}>
              <span className="text-[10px] font-bold">T{i+1}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Followup section */}
      {followups && followups.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">FOLLOWUPS</p>
          <div className="flex flex-col gap-1">
            {followups.map((f: any) => (
              <div key={f.id} className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] ${
                f.status === "done" ? "bg-emerald-50/50 text-neutral-400 line-through" : "bg-[#faf8f3] text-[#1a1a1a]"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{f.scheduled_date.slice(5)}</span>
                  <span className="text-[10px]">{f.scheduled_time}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    f.type === "arrival" ? "bg-emerald-100 text-emerald-700" :
                    f.type.startsWith("confirmation") ? "bg-gold/10 text-gold-dark" :
                    "bg-neutral-100 text-neutral-600"
                  }`}>{f.type.replace("_", " ")}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {f.status === "done" && <span className="text-emerald-500 text-xs">✓</span>}
                  {f.status === "done" && f.completed_by && (
                    <span className="text-[8px] text-neutral-400 whitespace-nowrap">{f.completed_by}</span>
                  )}
                  {f.status === "done" && f.completed_at && (
                    <span className="text-[8px] text-neutral-400 font-mono">{f.completed_at.slice(5, 16).replace("T", " ")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CloserDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/leads?scope=closer_pipeline");
    if (res.ok) { const d = await res.json(); setLeads(d.leads ?? []); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pipelineLeads = leads.filter(l => l.handoff_status === "accepted");

  const activeCount = pipelineLeads.length;
  const hotCount = pipelineLeads.filter(l => l.closer_status === "hot").length;
  const arrivedCount = pipelineLeads.filter(l => l.closer_status === "arrived").length;
  const lostCount = pipelineLeads.filter(l => l.closer_status === "lost").length;
  const newCount = pipelineLeads.filter(l => l.closer_status === "new" || l.closer_status === "").length;
  const coldCount = pipelineLeads.filter(l => l.closer_status === "cold").length;

  function getStatusColor(status: string): string {
    if (status === "hot") return "red";
    if (status === "cold") return "gray";
    if (status === "arrived") return "green";
    if (status === "lost") return "gray";
    return "blue";
  }

  function getStatusLabel(status: string): string {
    if (status === "hot") return "Hot";
    if (status === "cold") return "Cold";
    if (status === "arrived") return "Arrived";
    if (status === "lost") return "Lost";
    return "New";
  }

  function countTouchpoints(lead: Lead): number {
    let c = 0;
    if (lead.t1) c++;
    if (lead.t2) c++;
    if (lead.t3) c++;
    if (lead.t4) c++;
    if (lead.t5) c++;
    if (lead.t6) c++;
    return c;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <KpiCard label="Active Pipeline" value={String(activeCount)} change="" icon={GitBranch} positive />
        <KpiCard label="Hot Leads" value={String(hotCount)} change="" icon={Flame} positive />
        <KpiCard label="Arrived This Week" value={String(arrivedCount)} change="" icon={TrendingUp} positive />
        <KpiCard label="Lost This Week" value={String(lostCount)} change="" icon={TrendingDown} positive />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionTitle title="Active Pipeline" subtitle="Qualified leads requiring follow-up" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pipelineLeads.length > 0 ? (
              pipelineLeads.slice(0, 6).map(lead => (
                <PipelineCard key={lead.id} name={lead.name} phone={lead.phone} status={getStatusLabel(lead.closer_status)} color={getStatusColor(lead.closer_status)} touchpoints={countTouchpoints(lead)} appointmentDate={lead.appointment_date} followups={lead.followups} />
              ))
            ) : (
              <div className="col-span-full bg-white border border-dashed border-neutral-200 rounded-lg p-8 text-center">
                <GitBranch className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-500">No active pipeline leads yet</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <SectionTitle title="Pipeline Health" subtitle="Status breakdown" />
          <div className="bg-white border border-neutral-200 rounded-lg p-5">
            {[
              { label: "New", count: String(newCount), dot: "bg-blue-500" },
              { label: "Hot", count: String(hotCount), dot: "bg-red-500" },
              { label: "Cold", count: String(coldCount), dot: "bg-neutral-400" },
            ].map(({ label, count, dot }, i, a) => (
              <div key={label} className={`flex items-center justify-between py-2.5 ${i < a.length-1 ? "border-b border-neutral-100" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="text-xs text-neutral-700">{label}</span>
                </div>
                <span className="text-sm font-bold text-[#1a1a1a]">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <SectionTitle title="Upcoming Appointments" subtitle="Next 7 days" />
            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              {pipelineLeads.filter(l => l.appointment_date).slice(0, 5).length > 0 ? (
                pipelineLeads.filter(l => l.appointment_date).slice(0, 5).map((lead, i, a) => {
                  const d = new Date(lead.appointment_date!);
                  const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
                  return (
                    <div key={lead.id} className={`flex items-center gap-3 py-3 ${i < a.length-1 ? "border-b border-neutral-100" : ""}`}>
                      <div className="text-center px-3 py-2 bg-[#1a1a1a]/5 rounded-md border border-gold/20">
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-gold">{dayNames[d.getDay()]}</p>
                        <p className="text-xl font-bold text-[#1a1a1a] font-['Adorn_Condensed','Halis','Inter',sans-serif]">{String(d.getDate()).padStart(2, "0")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{lead.name}</p>
                        <p className="text-xs text-neutral-500">Appointment &bull; {lead.appointment_date}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <Calendar className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">No appointments scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



