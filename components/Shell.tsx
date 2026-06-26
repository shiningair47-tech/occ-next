"use client";
import {
  Gem, LayoutDashboard, Upload, UserCog, Users, RefreshCw, BarChart3,
  Trophy, ListChecks, GitBranch, LogOut, Eye, X, Shield, PhoneCall,
  ChevronDown,
} from "lucide-react";
import { ViewKey } from "@/lib/roleViews";
import { MemberPreviewOption } from "@/types";

interface IdentityInfo {
  currentUser: { email: string; name: string; role: string; team: string };
  effectiveUser: { email: string; name: string; role: string; team: string };
  isActualAdmin: boolean;
  isPreviewing: boolean;
  isPreviewingMember: boolean;
  previewRole: string;
  previewEmail: string;
  previewRoleLabel: string;
  effectiveRoleLabel: string;
  memberPreviewOptions: MemberPreviewOption[];
}

interface Props {
  identity: IdentityInfo;
  currentView: ViewKey;
  onViewChange: (v: ViewKey) => void;
  onSignOut: () => void;
  onSetPreviewRole: (role: string) => void;
  onPreviewMember: (email: string) => void;
  onExitPreview: () => void;
  children: React.ReactNode;
}

function NavLink({ label, icon: Icon, viewKey, active, onClick }: {
  label: string; icon: React.ElementType; viewKey: ViewKey; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={active
        ? "w-full flex items-center gap-3 px-4 py-2.5 rounded-md bg-[#1a1a1a] text-gold font-medium border border-gold/30 cursor-pointer"
        : "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-neutral-600 hover:bg-[#faf8f3] hover:text-[#1a1a1a] transition-colors cursor-pointer text-left"
      }>
      <Icon className="h-4 w-4" />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );
}

function AdminNav({ current, onChange }: { current: ViewKey; onChange: (v: ViewKey) => void }) {
  const links: { label: string; icon: React.ElementType; key: ViewKey }[] = [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Lead Upload", icon: Upload, key: "upload" },
    { label: "Users", icon: UserCog, key: "users" },
    { label: "Teams", icon: Users, key: "teams" },
    { label: "Replacements", icon: RefreshCw, key: "replacements" },
    { label: "Reports", icon: BarChart3, key: "reports" },
    { label: "Leaderboard", icon: Trophy, key: "leaderboard" },
  ];
  return (
    <div className="flex flex-col gap-1">
      {links.map(l => <NavLink key={l.key} label={l.label} icon={l.icon} viewKey={l.key} active={current === l.key} onClick={() => onChange(l.key)} />)}
    </div>
  );
}

function SetterNav({ current, onChange }: { current: ViewKey; onChange: (v: ViewKey) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <NavLink label="Dashboard" icon={LayoutDashboard} viewKey="dashboard" active={current === "dashboard"} onClick={() => onChange("dashboard")} />
      <NavLink label="My Queue" icon={ListChecks} viewKey="queue" active={current === "queue"} onClick={() => onChange("queue")} />
      <NavLink label="Leaderboard" icon={Trophy} viewKey="leaderboard" active={current === "leaderboard"} onClick={() => onChange("leaderboard")} />
    </div>
  );
}

function CloserNav({ current, onChange }: { current: ViewKey; onChange: (v: ViewKey) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <NavLink label="Dashboard" icon={LayoutDashboard} viewKey="dashboard" active={current === "dashboard"} onClick={() => onChange("dashboard")} />
      <NavLink label="Pipeline" icon={GitBranch} viewKey="pipeline" active={current === "pipeline"} onClick={() => onChange("pipeline")} />
      <NavLink label="Leaderboard" icon={Trophy} viewKey="leaderboard" active={current === "leaderboard"} onClick={() => onChange("leaderboard")} />
    </div>
  );
}

export default function Shell({
  identity, currentView, onViewChange, onSignOut,
  onSetPreviewRole, onPreviewMember, onExitPreview, children,
}: Props) {
  const { currentUser, effectiveUser, isActualAdmin, isPreviewing, isPreviewingMember,
    previewRole, previewEmail, previewRoleLabel, effectiveRoleLabel, memberPreviewOptions } = identity;

  const effectiveRole = effectiveUser.role;

  const headerTitles: Record<string, string> = {
    admin: "Operations Command Center",
    setter: "Setter Workspace",
    closer: "Closer Pipeline",
  };
  const headerSubtitles: Record<string, string> = {
    admin: "Monitor pipeline health, assignments, and team performance.",
    setter: "Work your queue, qualify leads, and hit your daily targets.",
    closer: "Move qualified leads through the pipeline to arrival.",
  };

  return (
    <div className="flex min-h-screen w-full bg-[#fdfbf6] font-['Halis','Inter',sans-serif] text-[#1a1a1a]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#fdfbf6] border-r border-neutral-200 sticky top-0">
        <div className="flex-1 overflow-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-4 border-b border-neutral-200">
            <div className="h-10 w-10 rounded-md bg-[#1a1a1a] flex items-center justify-center">
              <Gem className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-[0.2em] text-[#1a1a1a] leading-none font-['Adorn_Condensed','Halis','Inter',sans-serif]">SHINING</p>
              <p className="text-[10px] font-medium tracking-[0.3em] text-gold mt-1">OVERSEAS</p>
            </div>
          </div>
          {/* Nav */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 px-4 mb-3 mt-6">WORKSPACE</p>
            {effectiveRole === "setter" ? (
              <SetterNav current={currentView} onChange={onViewChange} />
            ) : effectiveRole === "closer" ? (
              <CloserNav current={currentView} onChange={onViewChange} />
            ) : (
              <AdminNav current={currentView} onChange={onViewChange} />
            )}
          </div>
        </div>
        {/* User footer */}
        <div>
          {isPreviewing && (
            <div className="flex items-center gap-1.5 mx-3 mt-2 mb-1 px-2 py-1 rounded-md bg-gold/10 border border-gold/30">
              <Eye className="h-3 w-3 text-gold shrink-0" />
              <span className="text-[10px] text-neutral-500">Previewing as </span>
              <span className="text-[10px] font-bold text-gold-dark">{previewRoleLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-3 border-t border-neutral-200">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-[#1a1a1a]">{effectiveUser.name}</p>
              <p className="text-xs text-neutral-500">{effectiveRoleLabel}</p>
              {isPreviewingMember && effectiveUser.team && (
                <p className="text-[10px] font-semibold tracking-[0.2em] text-gold-dark mt-0.5 uppercase">{effectiveUser.team}</p>
              )}
            </div>
            <button onClick={onSignOut} title="Sign out"
              className="ml-auto p-2 rounded-md text-neutral-400 hover:text-[#1a1a1a] hover:bg-[#faf8f3] transition-colors cursor-pointer">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Preview banner */}
        {isPreviewing && (
          <div className="bg-[#0f0f0f] border-b border-gold/30">
            <div className="flex items-center justify-between gap-4 px-6 md:px-10 py-3 max-w-full">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <Eye className="h-3.5 w-3.5 text-gold shrink-0" />
                {isPreviewingMember ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-gold">MEMBER PREVIEW · </span>
                    <span className="text-[11px] text-neutral-300">Viewing the workspace as </span>
                    <span className="text-[11px] font-bold text-gold">{effectiveUser.name}</span>
                    <span className="text-[11px] text-neutral-500"> · </span>
                    <span className="text-[11px] font-semibold text-gold">{effectiveRoleLabel}</span>
                    {effectiveUser.team && (
                      <>
                        <span className="text-[11px] text-neutral-500"> · </span>
                        <span className="text-[11px] font-semibold text-white">{effectiveUser.team}</span>
                      </>
                    )}
                    <span className="text-[11px] text-neutral-400">. Admin identity preserved (</span>
                    <span className="text-[11px] font-semibold text-white">{currentUser.name}</span>
                    <span className="text-[11px] text-neutral-400">).</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-gold">PREVIEW MODE · </span>
                    <span className="text-[11px] text-neutral-300">You are viewing the workspace as a </span>
                    <span className="text-[11px] font-semibold text-gold">{previewRoleLabel}</span>
                    <span className="text-[11px] text-neutral-300">. Your admin identity (</span>
                    <span className="text-[11px] font-semibold text-white">{currentUser.name}</span>
                    <span className="text-[11px] text-neutral-300">) is unchanged.</span>
                  </div>
                )}
              </div>
              <button onClick={onExitPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold text-[#1a1a1a] border border-gold hover:bg-[#e0bd4a] transition-colors cursor-pointer shrink-0">
                <X className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold tracking-wide">Exit Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-[#fdfbf6]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-6 md:px-10 py-8 border-b border-neutral-200">
            <div>
              <div className="flex items-center">
                <p className="text-[10px] font-semibold tracking-[0.3em] text-gold">LEAD ENGINE</p>
                {isPreviewing && <span className="text-[10px] font-bold tracking-[0.3em] text-gold-dark ml-2">· PREVIEWING</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mt-1">
                {headerTitles[effectiveRole] ?? "Dashboard"}
              </h1>
              <p className="text-sm text-neutral-500 mt-1.5">{headerSubtitles[effectiveRole] ?? ""}</p>
            </div>
            <div className="flex flex-col lg:flex-row items-end gap-6">
              {/* Preview controls (admin only) */}
              {isActualAdmin && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye className="h-3 w-3 text-gold" />
                    <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-dark">PREVIEW AS</p>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {(["admin","setter","closer"] as const).map(r => {
                      const icons = { admin: Shield, setter: PhoneCall, closer: GitBranch };
                      const Icon = icons[r];
                      const labels = { admin: "Admin", setter: "Setter", closer: "Closer" };
                      const isActive = previewRole === r || (r === "admin" && !previewRole && !previewEmail);
                      return (
                        <button key={r} onClick={() => onSetPreviewRole(r)}
                          className={isActive
                            ? "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a] text-gold border border-gold/40 transition-colors cursor-pointer"
                            : "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-neutral-600 border border-neutral-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors cursor-pointer"}>
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold tracking-wide">{labels[r]}</span>
                        </button>
                      );
                    })}
                  </div>
                  {memberPreviewOptions.length > 0 && (
                    <div className="relative min-w-[260px]">
                      <select
                        value={previewEmail || ""}
                        onChange={e => onPreviewMember(e.target.value)}
                        className="appearance-none w-full px-3 py-1.5 pr-8 rounded-full border border-neutral-200 bg-white text-[11px] font-semibold tracking-wide text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer">
                        <option value="" disabled>— Preview a specific member —</option>
                        {memberPreviewOptions.map(m => (
                          <option key={m.email} value={m.email}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}
              {/* Identity chip */}
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">SIGNED IN AS</p>
                <div className="flex items-center px-3.5 py-2 rounded-full bg-white border border-gold/40 gap-2">
                  <Shield className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-semibold tracking-wide text-[#1a1a1a]">{effectiveRoleLabel}</span>
                </div>
                {effectiveUser.team && (
                  <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-500 mt-2 text-right">{effectiveUser.team}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-6 md:px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}


