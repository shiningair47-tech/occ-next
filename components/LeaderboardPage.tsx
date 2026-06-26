"use client";
import { useState, useEffect, useCallback } from "react";
import { Crown, Trophy, Medal, Users, PlaneLanding, Target, Activity } from "lucide-react";

interface TeamRow {
  name: string; setter: string; closer: string;
  leads: number; qualified: number; arrived: number;
  arrival_rate: number; rank: number;
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center mb-4"><Icon className="h-4 w-4 text-gold" /></div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5 tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 w-fit">
      <Crown className="h-4 w-4 text-gold" /><span className="text-xs font-bold text-gold-dark">1st</span>
    </div>
  );
  if (rank === 2) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 w-fit">
      <Trophy className="h-3.5 w-3.5 text-neutral-400" /><span className="text-xs font-bold text-neutral-600">2nd</span>
    </div>
  );
  if (rank === 3) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 w-fit">
      <Medal className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs font-bold text-amber-700">3rd</span>
    </div>
  );
  return (
    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-neutral-50 border border-neutral-200">
      <span className="text-xs font-semibold text-neutral-500">{rank}</span>
    </div>
  );
}

export default function LeaderboardPage({ userTeam, effectiveRole }: { userTeam: string; effectiveRole: string }) {
  const [teams, setTeams] = useState<TeamRow[]>([]);

  const load = useCallback(async () => {
    const [lr, tr] = await Promise.all([
      fetch("/api/leads?scope=all"),
      fetch("/api/teams"),
    ]);
    if (!lr.ok || !tr.ok) return;
    const leadsData = await lr.json();
    const teamsData = await tr.json();

    const allLeads: { team: string; setter: string; closer: string; setter_status: string; closer_status: string }[] = leadsData.leads ?? [];
    const allTeams: string[] = teamsData.teams;
    const allUsers: { name: string; role: string; team: string }[] = teamsData.users;

    const rows: TeamRow[] = allTeams.map(t => {
      const teamLeads = allLeads.filter(l => l.team === t);
      const members = allUsers.filter(u => u.team === t);
      const setter = members.find(u => u.role === "setter")?.name ?? "";
      const closer = members.find(u => u.role === "closer")?.name ?? "";
      const leads = teamLeads.length;
      const qualified = teamLeads.filter(l => l.setter_status === "qualified").length;
      const arrived = teamLeads.filter(l => l.closer_status === "arrived").length;
      const arrival_rate = leads > 0 ? Math.round((arrived / leads) * 1000) / 10 : 0;
      return { name: t, setter, closer, leads, qualified, arrived, arrival_rate, rank: 0 };
    });

    // Rank by arrivals desc, then arrival_rate
    rows.sort((a, b) => b.arrived - a.arrived || b.arrival_rate - a.arrival_rate);
    rows.forEach((r, i) => { r.rank = i + 1; });
    setTeams(rows);
  }, []);

  useEffect(() => { load(); }, [load]);

  const topPerformer = teams[0]?.name ?? "—";
  const totalArrivals = teams.reduce((s, t) => s + t.arrived, 0);
  const totalQualified = teams.reduce((s, t) => s + t.qualified, 0);
  const totalLeads = teams.reduce((s, t) => s + t.leads, 0);

  const subtitles: Record<string, string> = {
    admin: "Real-time rankings across all active teams based on arrivals and conversions.",
    setter: "See how your team stacks up against the rest of the floor. Updated live from the pipeline.",
    closer: "Track your team's standing across the floor. Rankings reflect arrivals and conversions.",
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-gold">TEAM STANDINGS</p>
          <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mt-1">Team Leaderboard</h2>
          <p className="text-sm text-neutral-500 mt-1">{subtitles[effectiveRole] ?? subtitles.admin}</p>
        </div>
        {userTeam && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-gold/30 w-fit">
            <Users className="h-3.5 w-3.5 text-gold" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-neutral-500">YOUR TEAM · </span>
            <span className="text-[11px] font-bold tracking-wide text-[#1a1a1a]">{userTeam}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="TOP PERFORMER" value={topPerformer} icon={Crown} />
        <Kpi label="TOTAL ARRIVALS" value={totalArrivals} icon={PlaneLanding} />
        <Kpi label="TOTAL CONVERSIONS" value={totalQualified} icon={Target} />
        <Kpi label="TOTAL LEADS" value={totalLeads} icon={Activity} />
      </div>

      {teams.length > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="table-auto w-full">
            <thead>
              <tr className="bg-[#faf8f3] border-b border-neutral-200">
                {["Rank","Team","Leads / Deals","Conversions","Arrivals","Conv. Rate"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const isMyTeam = t.name === userTeam;
                return (
                  <tr key={t.name} className={`border-b border-neutral-100 hover:bg-[#faf8f3] transition-colors ${isMyTeam ? "bg-gold/5" : ""}`}>
                    <td className="px-4 py-4 whitespace-nowrap align-middle"><RankBadge rank={t.rank} /></td>
                    <td className={`px-4 py-4 whitespace-nowrap align-middle ${isMyTeam ? "bg-gold/5" : ""}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#1a1a1a]">{t.name}</p>
                          {isMyTeam && <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase border bg-gold/10 text-gold-dark border-gold/40 w-fit">YOUR TEAM</span>}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">Setter: {t.setter || "—"} · Closer: {t.closer || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700 align-middle">{t.leads}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700 align-middle">{t.qualified}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-emerald-700 align-middle">{t.arrived}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#1a1a1a] align-middle">{t.arrival_rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 text-center">
          <Users className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium">No team metrics available to calculate standings.</p>
        </div>
      )}
    </div>
  );
}


