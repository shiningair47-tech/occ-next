"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, Target, PlaneLanding, RefreshCw } from "lucide-react";
import { KpiSkeleton } from "./LoadingSkeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList,
} from "recharts";
import { Lead } from "@/types";
function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center mb-4"><Icon className="h-4 w-4 text-gold" /></div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5 tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{title}</h3>
        <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "white", borderColor: "#E8E8E8", borderRadius: "0.5rem", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", fontWeight: 500, padding: "0.5rem 0.75rem" },
  labelStyle: { color: "#1a1a1a", fontWeight: 600 },
  itemStyle: { color: "#1a1a1a" },
  cursor: { fill: "rgba(212, 175, 55, 0.08)" },
};

type Range = "7d" | "30d" | "90d" | "all";

function rangeDays(r: Range) { return r === "7d" ? 7 : r === "30d" ? 30 : r === "90d" ? 90 : 99999; }

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="flex items-center flex-wrap gap-4 mb-3">
      {items.map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 inline-block rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-xs text-neutral-700 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openReps, setOpenReps] = useState(0);
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [lr, rr] = await Promise.all([
      fetch("/api/leads?scope=all"),
      fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_replacements" }) }),
    ]);
    if (lr.ok) { const d = await lr.json(); setLeads(d.leads ?? []); }
    if (rr.ok) { const d = await rr.json(); setOpenReps((d.replacements ?? []).filter((r: { status: string }) => r.status === "open").length); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter by range
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays(range));
  const filteredLeads = range === "all" ? leads : leads.filter(l => l.assigned_at && new Date(l.assigned_at) >= cutoff);

  if (loading) return (
    <div>
      <div className="mb-6">
        <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded mb-2" />
        <div className="h-8 w-48 bg-neutral-200 animate-pulse rounded mb-1" />
        <div className="h-4 w-72 bg-neutral-200 animate-pulse rounded" />
      </div>
      <KpiSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="h-5 w-40 bg-neutral-200 animate-pulse rounded mb-1" />
          <div className="h-3 w-56 bg-neutral-200 animate-pulse rounded mb-4" />
          <div className="h-[300px] bg-neutral-100 rounded" />
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="h-5 w-40 bg-neutral-200 animate-pulse rounded mb-1" />
          <div className="h-3 w-56 bg-neutral-200 animate-pulse rounded mb-4" />
          <div className="h-[280px] bg-neutral-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="h-5 w-40 bg-neutral-200 animate-pulse rounded mb-1" />
          <div className="h-3 w-56 bg-neutral-200 animate-pulse rounded mb-4" />
          <div className="h-[280px] bg-neutral-100 rounded" />
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="h-5 w-40 bg-neutral-200 animate-pulse rounded mb-1" />
          <div className="h-3 w-56 bg-neutral-200 animate-pulse rounded mb-4" />
          <div className="h-[280px] bg-neutral-100 rounded" />
        </div>
      </div>
    </div>
  );

  const total = filteredLeads.length;
  const qualified = filteredLeads.filter(l => (l.setter_status === "qualified" || l.setter_status === "appointment_fixed") || l.closer_status).length;
  const arrived = filteredLeads.filter(l => l.closer_status === "arrived").length;
  const qualRate = total > 0 ? `${Math.round((qualified / total) * 100)}%` : "0%";
  const arrRate = total > 0 ? `${Math.round((arrived / total) * 100)}%` : "0%";

  // Funnel data
  const hotPipeline = filteredLeads.filter(l => l.closer_status === "hot").length;
  const funnelData = [
    { name: "Total Leads", value: total, fill: "#1a1a1a" },
    { name: "Qualified", value: qualified, fill: "#8a6d1a" },
    { name: "Hot Pipeline", value: hotPipeline, fill: "#d4af37" },
    { name: "Arrived", value: arrived, fill: "#059669" },
  ];

  // Team performance chart
  const teamSet = [...new Set(filteredLeads.map(l => l.team).filter(Boolean))];
  const teamChart = teamSet.map(t => {
    const tl = filteredLeads.filter(l => l.team === t);
    return {
      team: t.replace("Pair ", "").replace("Team ", ""),
      total: tl.length,
      qualified: tl.filter(l => l.setter_status === "qualified" || l.setter_status === "appointment_fixed").length,
      arrived: tl.filter(l => l.closer_status === "arrived").length,
    };
  }).sort((a, b) => b.total - a.total);

  // Setter activity chart
  const setterSet = [...new Set(filteredLeads.map(l => l.setter).filter(Boolean))];
  const setterChart = setterSet.map(s => {
    const sl = filteredLeads.filter(l => l.setter === s);
    return {
      name: s.split(" ")[0],
      qualified: sl.filter(l => l.setter_status === "qualified" || l.setter_status === "appointment_fixed").length,
      flagged: sl.filter(l => l.setter_status === "bad" || l.setter_status === "wrong_number").length,
    };
  });

  // Closer outcomes chart
  const closerStatuses = ["new", "hot", "cold", "arrived", "lost"];
  const closerChart = [
    { name: "Unworked", value: filteredLeads.filter(l => !l.closer_status).length },
    ...closerStatuses.map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: filteredLeads.filter(l => l.closer_status === s).length,
    })),
  ];

  const RANGES: { label: string; value: Range }[] = [
    { label: "7 Days", value: "7d" }, { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" }, { label: "All Time", value: "all" },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Reports</h2>
          <p className="text-sm text-neutral-500 mt-1">Conversion funnel, team and individual performance</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">DATE RANGE</p>
          <div className="flex items-center gap-2 flex-wrap">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`px-3.5 py-2 rounded-full border transition-all text-xs font-medium tracking-wide ${range === r.value ? "bg-[#1a1a1a] text-gold border-gold/40" : "bg-white text-neutral-600 border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a]"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="LEADS IN RANGE" value={total} icon={Activity} />
        <Kpi label="QUAL RATE" value={qualRate} icon={Target} />
        <Kpi label="ARRIVAL RATE" value={arrRate} icon={PlaneLanding} />
        <Kpi label="REPLACEMENTS" value={openReps} icon={RefreshCw} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <SectionCard title="Conversion Funnel" subtitle="From upload to arrival">
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip {...TOOLTIP_STYLE} />
              <Funnel dataKey="value" data={funnelData}>
                <LabelList position="right" dataKey="name" fill="#1a1a1a" stroke="none" style={{ fontSize: "12px", fontWeight: 600 }} />
                <LabelList position="center" dataKey="value" fill="#fff" stroke="none" style={{ fontSize: "13px", fontWeight: 700 }} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Closer Outcomes" subtitle="Pipeline status distribution">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={closerChart} margin={{ left: 0, right: 20, top: 25, bottom: 5 }} barSize={32}>
              <CartesianGrid horizontal vertical={false} opacity={0.25} />
              <Tooltip {...TOOLTIP_STYLE} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: "11px" }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: "11px" }} />
              <Bar dataKey="value" name="Leads" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Team Performance" subtitle="Total, qualified, and arrived leads per team">
          <Legend items={[["Total", "#1a1a1a"], ["Qualified", "#8a6d1a"], ["Arrived", "#d4af37"]]} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamChart} margin={{ left: 0, right: 20, top: 25, bottom: 5 }} barSize={18}>
              <CartesianGrid horizontal vertical={false} opacity={0.25} />
              <Tooltip {...TOOLTIP_STYLE} />
              <XAxis dataKey="team" axisLine={false} tickLine={false} style={{ fontSize: "11px" }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: "11px" }} />
              <Bar dataKey="total" name="Total" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="qualified" name="Qualified" fill="#8a6d1a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="arrived" name="Arrived" fill="#d4af37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Setter Activity" subtitle="Qualified vs flagged leads per setter">
          <Legend items={[["Qualified", "#d4af37"], ["Flagged", "#dc2626"]]} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={setterChart} margin={{ left: 0, right: 20, top: 25, bottom: 5 }} barSize={14}>
              <CartesianGrid horizontal vertical={false} opacity={0.25} />
              <Tooltip {...TOOLTIP_STYLE} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: "11px" }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: "11px" }} />
              <Bar dataKey="qualified" name="Qualified" fill="#d4af37" radius={[4, 4, 0, 0]} />
              <Bar dataKey="flagged" name="Flagged" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}



