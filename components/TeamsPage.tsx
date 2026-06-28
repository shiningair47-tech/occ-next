"use client";
import { useState, useEffect } from "react";
import { Users, Plus, UserMinus, UserPlus, Trash2, CircleAlert, CircleCheck, ChevronDown } from "lucide-react";
import { CardSkeleton } from "./LoadingSkeleton";
import toast from "react-hot-toast";

interface TeamCard {
  name: string;
  setter_name: string;
  setter_email: string;
  closer_name: string;
  closer_email: string;
  status: "complete" | "partial" | "empty";
  member_count: number;
  can_delete: boolean;
}
interface UserOption { email: string; name: string; label: string; }

function StatusPill({ status }: { status: string }) {
  if (status === "complete") return <span className="inline-flex px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">Complete</span>;
  if (status === "partial") return <span className="inline-flex px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-amber-50 text-amber-700 border-amber-200 w-fit">Needs Pair</span>;
  return <span className="inline-flex px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-neutral-100 text-neutral-600 border-neutral-200 w-fit">Empty</span>;
}

function SummaryChip({ label, value, dotColor }: { label: string; value: number; dotColor: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-sm font-bold text-[#1a1a1a] font-['Adorn_Condensed','Halis','Inter',sans-serif]">{value}</span>
      <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">{label}</span>
    </div>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [setterOptions, setSetterOptions] = useState<UserOption[]>([]);
  const [closerOptions, setCloserOptions] = useState<UserOption[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [assignSelects, setAssignSelects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/teams");
    if (!res.ok) setLoading(false); return;
    const data = await res.json();
    // Build team cards from teams + users
    const allTeams: string[] = data.teams;
    const allUsers: { email: string; name: string; role: string; team: string; active: boolean }[] = data.users;

    const cards: TeamCard[] = allTeams.map(t => {
      const members = allUsers.filter(u => u.team === t && u.active);
      const setter = members.find(u => u.role === "setter");
      const closer = members.find(u => u.role === "closer");
      const status = setter && closer ? "complete" : setter || closer ? "partial" : "empty";
      return {
        name: t,
        setter_name: setter?.name ?? "",
        setter_email: setter?.email ?? "",
        closer_name: closer?.name ?? "",
        closer_email: closer?.email ?? "",
        status,
        member_count: members.length,
        can_delete: members.length === 0,
      };
    });
    setTeams(cards);

    // Build options
    const setters = allUsers.filter(u => u.role === "setter" && u.active).map(u => ({
      email: u.email, name: u.name,
      label: u.team ? `${u.name}  ·  in ${u.team}` : `${u.name}  ·  Unassigned`,
    }));
    const closers = allUsers.filter(u => u.role === "closer" && u.active).map(u => ({
      email: u.email, name: u.name,
      label: u.team ? `${u.name}  ·  in ${u.team}` : `${u.name}  ·  Unassigned`,
    }));
    setSetterOptions(setters);
    setCloserOptions(closers);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(""); setCreateSuccess("");
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: newTeamName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error); return; }
    setCreateSuccess(`Team '${newTeamName.trim()}' created. Assign a setter and a closer below.`);
    setNewTeamName("");
    toast.success(`Team created`);
    await load();
  }

  async function handleDelete(name: string) {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", name }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(`Team deleted`);
    await load();
  }

  async function handleAssign(team: string, role: string, email: string) {
    if (!email) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_member", team, role, email }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Member assigned");
    await load();
  }

  async function handleUnassign(email: string) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unassign_member", email }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Member removed");
    await load();
  }

  const total = teams.length;
  const complete = teams.filter(t => t.status === "complete").length;
  const partial = teams.filter(t => t.status === "partial").length;
  const empty = teams.filter(t => t.status === "empty").length;

  if (loading) return (
    <div>
      <div className="mb-6">
        <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded mb-2" />
        <div className="h-8 w-48 bg-neutral-200 animate-pulse rounded mb-1" />
        <div className="h-4 w-96 bg-neutral-200 animate-pulse rounded" />
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
        <div className="h-[200px] bg-neutral-100 animate-pulse rounded" />
      </div>
      <CardSkeleton count={3} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Teams</h2>
          <p className="text-sm text-neutral-500 mt-1">One setter + one closer per team. Teams power lead upload, queues, and reports.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SummaryChip label="Total" value={total} dotColor="bg-[#1a1a1a]" />
          <SummaryChip label="Complete" value={complete} dotColor="bg-emerald-500" />
          <SummaryChip label="Needs Pair" value={partial} dotColor="bg-amber-500" />
          <SummaryChip label="Empty" value={empty} dotColor="bg-neutral-300" />
        </div>
      </div>

      {/* Create team */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center">
            <Plus className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Create New Team</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Choose a clear, recognizable name. You&apos;ll assign one setter and one closer below.</p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="w-full">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">TEAM NAME</p>
              <input type="text" value={newTeamName} onChange={e => { setNewTeamName(e.target.value); setCreateError(""); }}
                placeholder="e.g. Pair Atlas" maxLength={40} required
                className="w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
            <button type="submit"
              className="self-end flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] transition-colors h-[42px]">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide">Create Team</span>
            </button>
          </div>
          {createError && (
            <div className="flex items-start gap-2 px-3 py-2.5 mt-3 bg-red-50 border border-red-200 rounded-md">
              <CircleAlert className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{createError}</p>
            </div>
          )}
          {createSuccess && (
            <div className="flex items-start gap-2 px-3 py-2.5 mt-3 bg-emerald-50 border border-emerald-200 rounded-md">
              <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-800 font-medium">{createSuccess}</p>
            </div>
          )}
        </form>
      </div>

      {/* Teams grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">All Teams</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Assign or change the setter and closer for each team.</p>
        </div>
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map(t => {
              const setterSelect = assignSelects[`${t.name}_setter`] ?? "";
              const closerSelect = assignSelects[`${t.name}_closer`] ?? "";
              return (
                <div key={t.name} className="bg-white border border-neutral-200 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-gold" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">{t.name}</p>
                        <StatusPill status={t.status} />
                      </div>
                    </div>
                    {t.can_delete && (
                      <button onClick={() => handleDelete(t.name)} title="Delete empty team"
                        className="p-2 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Setter slot */}
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">SETTER</p>
                    {t.setter_name ? (
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#faf8f3] border border-gold/20 rounded-md">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-gold">{t.setter_name[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1a1a1a]">{t.setter_name}</p>
                            <p className="text-[10px] font-semibold tracking-[0.25em] text-gold-dark">SETTER</p>
                          </div>
                        </div>
                        <button onClick={() => handleUnassign(t.setter_email)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white text-neutral-600 border border-neutral-200 hover:border-red-400 hover:text-red-700 text-[10px] font-semibold transition-colors">
                          <UserMinus className="h-3 w-3" /><span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select value={setterSelect}
                            onChange={e => setAssignSelects(p => ({ ...p, [`${t.name}_setter`]: e.target.value }))}
                            className="appearance-none w-full px-3 py-2 pr-8 rounded-md border border-neutral-200 bg-white text-xs text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                            <option value="" disabled>— Choose a setter —</option>
                            {setterOptions.map(o => <option key={o.email} value={o.email}>{o.label}</option>)}
                          </select>
                          <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                        <button onClick={() => { handleAssign(t.name, "setter", setterSelect); setAssignSelects(p => ({ ...p, [`${t.name}_setter`]: "" })); }}
                          className="flex items-center gap-1 px-3 py-2 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[10px] font-semibold transition-colors">
                          <UserPlus className="h-3 w-3" /><span>Assign</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Closer slot */}
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">CLOSER</p>
                    {t.closer_name ? (
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#faf8f3] border border-gold/20 rounded-md">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-gold">{t.closer_name[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1a1a1a]">{t.closer_name}</p>
                            <p className="text-[10px] font-semibold tracking-[0.25em] text-gold-dark">CLOSER</p>
                          </div>
                        </div>
                        <button onClick={() => handleUnassign(t.closer_email)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white text-neutral-600 border border-neutral-200 hover:border-red-400 hover:text-red-700 text-[10px] font-semibold transition-colors">
                          <UserMinus className="h-3 w-3" /><span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select value={closerSelect}
                            onChange={e => setAssignSelects(p => ({ ...p, [`${t.name}_closer`]: e.target.value }))}
                            className="appearance-none w-full px-3 py-2 pr-8 rounded-md border border-neutral-200 bg-white text-xs text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                            <option value="" disabled>— Choose a closer —</option>
                            {closerOptions.map(o => <option key={o.email} value={o.email}>{o.label}</option>)}
                          </select>
                          <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                        <button onClick={() => { handleAssign(t.name, "closer", closerSelect); setAssignSelects(p => ({ ...p, [`${t.name}_closer`]: "" })); }}
                          className="flex items-center gap-1 px-3 py-2 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[10px] font-semibold transition-colors">
                          <UserPlus className="h-3 w-3" /><span>Assign</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12">
            <div className="h-14 w-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-gold" />
            </div>
            <p className="text-base font-bold text-[#1a1a1a] text-center font-['Adorn_Condensed','Halis','Inter',sans-serif]">No teams yet</p>
            <p className="text-xs text-neutral-500 text-center mt-1.5 max-w-sm mx-auto">Create your first team using the form above to start routing leads.</p>
          </div>
        )}
      </div>
    </div>
  );
}


