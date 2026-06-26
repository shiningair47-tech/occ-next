"use client";
import { useState, useEffect } from "react";
import {
  Users, UserCheck, KeyRound, GitBranch, UserPlus, Pencil, X, Save,
  Trash2, UserX, CircleAlert, CircleCheck, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { ApiUser } from "@/types";

interface PairAssignment {
  name: string; setter: string; closer: string; status: string; members: number;
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

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-[#1a1a1a] text-gold border-gold/40 w-fit">Admin</span>;
  if (role === "setter") return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-blue-50 text-blue-700 border-blue-200 w-fit">Setter</span>;
  return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-gold/10 text-gold-dark border-gold/30 w-fit">Closer</span>;
}

function StatusBadge({ active, temp }: { active: boolean; temp: boolean }) {
  if (!active) return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-neutral-200 text-neutral-700 border-neutral-300 w-fit">Inactive</span>;
  if (temp) return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-amber-50 text-amber-700 border-amber-200 w-fit">Temp Password</span>;
  return <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">Active</span>;
}

function PairStatusBadge({ status }: { status: string }) {
  if (status === "complete") return <span className="inline-flex px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 w-fit ml-auto">Complete</span>;
  if (status === "partial") return <span className="inline-flex px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-amber-50 text-amber-700 border-amber-200 w-fit ml-auto">Needs Pair</span>;
  return <span className="inline-flex px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-neutral-100 text-neutral-600 border-neutral-200 w-fit ml-auto">Empty</span>;
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={active
        ? "px-3.5 py-2 rounded-full bg-[#1a1a1a] text-gold border border-gold/40 transition-all text-xs font-medium tracking-wide"
        : "px-3.5 py-2 rounded-full bg-white text-neutral-600 border border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all text-xs font-medium tracking-wide"}>
      {label}
    </button>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState("setter");
  const [regTeam, setRegTeam] = useState("");
  const [regTempPw, setRegTempPw] = useState("");

  async function load() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTeams(data.teams);
      if (!regTeam && data.teams.length > 0) setRegTeam(data.teams[0]);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(""); setRegSuccess(""); setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email: regEmail, name: regName, role: regRole, team: regTeam, tempPassword: regTempPw }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setRegError(data.error); return; }
    setRegSuccess(data.message);
    setRegName(""); setRegEmail(""); setRegRole("setter"); setRegTempPw("");
    toast.success("User registered!");
    await load();
  }

  async function doAction(action: string, email: string, extra?: Record<string, unknown>) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, email, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Done");
    setEditEmail(""); setEditError(""); setEditSuccess("");
    await load();
  }

  async function handleSaveEdit(e: React.FormEvent, u: User) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    setEditError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        email: u.email,
        name: fd.get("name"),
        role: fd.get("role"),
        team: fd.get("team"),
        active: fd.get("active") === "true",
      }),
    });
    const data = await res.json();
    if (!res.ok) { setEditError(data.error); return; }
    setEditSuccess(`Updated ${fd.get("name")}.`);
    setEditEmail("");
    toast.success("User updated");
    await load();
  }

  const filtered = users.filter(u => {
    if (filter === "all") return true;
    if (filter === "active") return u.active;
    if (filter === "inactive") return !u.active;
    if (filter === "temp") return u.temp_password;
    return u.role === filter;
  });

  // Build pair assignments from users + teams
  const pairAssignments: PairAssignment[] = teams.map(t => {
    const members = users.filter(u => u.team === t && u.active);
    const setter = members.find(u => u.role === "setter")?.name ?? "";
    const closer = members.find(u => u.role === "closer")?.name ?? "";
    const status = setter && closer ? "complete" : setter || closer ? "partial" : "empty";
    return { name: t, setter, closer, status, members: members.length };
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.active).length;
  const tempUsers = users.filter(u => u.temp_password).length;
  const settersCount = users.filter(u => u.role === "setter").length;
  const closersCount = users.filter(u => u.role === "closer").length;

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="TOTAL USERS" value={String(totalUsers)} icon={Users} />
        <Kpi label="ACTIVE" value={String(activeUsers)} icon={UserCheck} />
        <Kpi label="TEMP PASSWORD" value={String(tempUsers)} icon={KeyRound} />
        <Kpi label="SETTERS / CLOSERS" value={`${settersCount} / ${closersCount}`} icon={GitBranch} />
      </div>

      {/* Register + Pair coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Register New User</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Provision setters and closers with a temporary password and assigned pair.</p>
          </div>
          <form onSubmit={handleRegister} className="bg-white border border-neutral-200 rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">DISPLAY NAME</p>
                <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Full name" required
                  className="w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">EMAIL ADDRESS</p>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="user@example.com" required
                  className="w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">ROLE</p>
                <div className="relative">
                  <select value={regRole} onChange={e => setRegRole(e.target.value)}
                    className="appearance-none w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="setter">Setter</option>
                    <option value="closer">Closer</option>
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">ASSIGNED PAIR</p>
                {teams.length > 0 ? (
                  <div className="relative">
                    <select value={regTeam} onChange={e => setRegTeam(e.target.value)} required
                      className="appearance-none w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-amber-200 bg-amber-50">
                    <CircleAlert className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <p className="text-[11px] text-amber-900 font-medium">No teams exist yet. Create one in Teams first.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">TEMPORARY PASSWORD</p>
              <input type="text" value={regTempPw} onChange={e => setRegTempPw(e.target.value)} placeholder="Any temporary password (e.g. Welcome1)" required
                className="w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] font-mono focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" />
              <p className="text-[11px] text-neutral-500 mt-1.5">The user will set a strong permanent password on first login.</p>
            </div>
            {regError && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-red-50 border border-red-200 rounded-md">
                <CircleAlert className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-xs text-red-700 font-medium">{regError}</p>
              </div>
            )}
            {regSuccess && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 font-medium">{regSuccess}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] transition-colors disabled:opacity-60">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-semibold tracking-wide">{loading ? "Registering…" : "Register User"}</span>
              </button>
              <button type="button" onClick={() => { setRegError(""); setRegSuccess(""); }}
                className="px-4 py-2.5 rounded-md bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400 text-sm font-medium transition-colors">
                Clear
              </button>
            </div>
          </form>
        </div>
        {/* Pair coverage */}
        <div>
          <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mb-1">Pair Coverage</h3>
          <p className="text-[11px] text-neutral-500 mb-3">Each pair holds one setter + one closer.</p>
          <div className="flex flex-col gap-3">
            {pairAssignments.map(p => (
              <div key={p.name} className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-md bg-[#1a1a1a] flex items-center justify-center">
                    <Users className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{p.name}</p>
                    <p className="text-[11px] text-neutral-500">{p.members} member(s)</p>
                  </div>
                  <PairStatusBadge status={p.status} />
                </div>
                <div className="flex gap-4 pt-3 border-t border-neutral-100">
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400">SETTER</p>
                    <p className="text-xs text-[#1a1a1a] font-medium mt-1">{p.setter || <span className="text-neutral-400 italic">Unassigned</span>}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400">CLOSER</p>
                    <p className="text-xs text-[#1a1a1a] font-medium mt-1">{p.closer || <span className="text-neutral-400 italic">Unassigned</span>}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Directory */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">User Directory</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Manage roles, pairs, and access — reset, deactivate, or reactivate accounts.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[["All","all"],["Active","active"],["Inactive","inactive"],["Temp Password","temp"],["Setters","setter"],["Closers","closer"]].map(([l,v]) => (
            <FilterPill key={v} label={l} active={filter === v} onClick={() => setFilter(v)} />
          ))}
        </div>
      </div>

      {editSuccess && (
        <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
          <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800 font-medium">{editSuccess}</p>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="table-auto w-full">
          <thead>
            <tr className="bg-[#faf8f3] border-b border-neutral-200">
              {["User","Role","Pair","Status","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <>
                <tr key={u.email} className="border-b border-neutral-100 hover:bg-[#faf8f3] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-gold">{u.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{u.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{u.team || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge active={u.active} temp={u.temp_password} /></td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="text-xs text-neutral-300 px-2">—</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => { setEditEmail(editEmail === u.email ? "" : u.email); setEditError(""); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[10px] font-semibold transition-colors">
                          <Pencil className="h-3 w-3" /><span>Edit</span>
                        </button>
                        <button onClick={() => doAction("reset_password", u.email, { tempPassword: "Reset@2025" })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-gold text-[10px] font-semibold transition-colors">
                          <KeyRound className="h-3 w-3" /><span>Reset</span>
                        </button>
                        {u.active ? (
                          <button onClick={() => doAction("deactivate", u.email)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[10px] font-semibold transition-colors">
                            <UserX className="h-3 w-3" /><span>Deactivate</span>
                          </button>
                        ) : (
                          <button onClick={() => doAction("reactivate", u.email)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-semibold transition-colors">
                            <UserCheck className="h-3 w-3" /><span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                {editEmail === u.email && (
                  <tr key={`edit-${u.email}`} className="border-b border-neutral-100">
                    <td colSpan={5} className="px-4 py-4 bg-[#faf8f3] border-t border-gold/30">
                      <form onSubmit={e => handleSaveEdit(e, u)} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">DISPLAY NAME</p>
                            <input name="name" type="text" defaultValue={u.name} required
                              className="w-full px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">ROLE</p>
                            <div className="relative">
                              <select name="role" defaultValue={u.role}
                                className="appearance-none w-full px-3 py-2 pr-8 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none">
                                <option value="setter">Setter</option>
                                <option value="closer">Closer</option>
                              </select>
                              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">TEAM</p>
                            <div className="relative">
                              <select name="team" defaultValue={u.team}
                                className="appearance-none w-full px-3 py-2 pr-8 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none">
                                <option value="">— Unassigned —</option>
                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">ACTIVE STATUS</p>
                            <div className="relative">
                              <select name="active" defaultValue={u.active ? "true" : "false"}
                                className="appearance-none w-full px-3 py-2 pr-8 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none">
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                        {editError && (
                          <div className="flex items-start gap-2 px-3 py-2 mb-3 bg-red-50 border border-red-200 rounded-md">
                            <CircleAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
                            <p className="text-[11px] text-red-700 font-medium">{editError}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button type="submit"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a1a] text-gold border border-gold/40 hover:bg-[#2a2a2a] text-[11px] font-semibold transition-colors">
                            <Save className="h-3.5 w-3.5" /><span>Save Changes</span>
                          </button>
                          <button type="button" onClick={() => { setEditEmail(""); setEditError(""); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400 text-[11px] font-semibold transition-colors">
                            <X className="h-3.5 w-3.5" /><span>Cancel</span>
                          </button>
                          <button type="button" onClick={() => doAction("delete", u.email)}
                            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[11px] font-semibold transition-colors">
                            <Trash2 className="h-3.5 w-3.5" /><span>Delete User</span>
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



