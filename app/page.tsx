"use client";
import { useState, useEffect, useCallback } from "react";
import LoginPage from "@/components/LoginPage";
import Shell from "@/components/Shell";
import { AdminDashboard, SetterDashboard, CloserDashboard } from "@/components/Dashboard";
import UsersPage from "@/components/UsersPage";
import TeamsPage from "@/components/TeamsPage";
import AdminUploadPage from "@/components/AdminUploadPage";
import SetterQueuePage from "@/components/SetterQueuePage";
import CloserPipelinePage from "@/components/CloserPipelinePage";
import ReplacementsPage from "@/components/ReplacementsPage";
import LeaderboardPage from "@/components/LeaderboardPage";
import ReportsPage from "@/components/ReportsPage";
import FollowupsPage from "@/components/FollowupsPage";
import { allowedViewsFor } from "@/lib/roleViews";
import { ViewKey, MemberPreviewOption, Role } from "@/types";

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

export default function Home() {
  const [identity, setIdentity] = useState<IdentityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewKey>("dashboard");

  const fetchIdentity = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) { setIdentity(null); return; }
      const data = await res.json();
      if (!data.authenticated) { setIdentity(null); return; }
      setIdentity(data);
      const allowed = allowedViewsFor(data.effectiveUser.role as Role);
      setCurrentView(v => allowed.includes(v) ? v : "dashboard");
    } catch {
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIdentity(); }, [fetchIdentity]);

  async function handleLogin() {
    setLoading(true);
    await fetchIdentity();
  }

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setIdentity(null);
    setCurrentView("dashboard");
  }

  async function handleSetPreviewRole(role: string) {
    await fetch("/api/auth/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_role", role }),
    });
    await fetchIdentity();
    setCurrentView("dashboard");
  }

  async function handlePreviewMember(email: string) {
    if (!email) return;
    await fetch("/api/auth/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preview_member", email }),
    });
    await fetchIdentity();
    setCurrentView("dashboard");
  }

  async function handleExitPreview() {
    await fetch("/api/auth/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "exit" }),
    });
    await fetchIdentity();
    setCurrentView("dashboard");
  }

  function handleViewChange(v: ViewKey) {
    if (!identity) return;
    const allowed = allowedViewsFor(identity.effectiveUser.role as Role);
    if (allowed.includes(v)) setCurrentView(v);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-[#1a1a1a] flex items-center justify-center animate-pulse">
            <span className="text-gold text-lg font-bold">S</span>
          </div>
          <p className="text-sm text-neutral-500 tracking-wide">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!identity) return <LoginPage onLogin={handleLogin} />;

  const effectiveRole = identity.effectiveUser.role as Role;
  const effectiveUser = identity.effectiveUser;

  function renderPage() {
    switch (currentView) {
      case "dashboard":
        if (effectiveRole === "setter") return <SetterDashboard />;
        if (effectiveRole === "closer") return <CloserDashboard />;
        return <AdminDashboard />;
      case "upload":      return <AdminUploadPage />;
      case "users":       return <UsersPage />;
      case "teams":       return <TeamsPage />;
      case "replacements": return <ReplacementsPage />;
      case "reports":     return <ReportsPage />;
      case "leaderboard": return <LeaderboardPage userTeam={effectiveUser.team} effectiveRole={effectiveRole} />;
      case "queue":       return <SetterQueuePage userName={effectiveUser.name} userTeam={effectiveUser.team} />;
      case "pipeline":    return <CloserPipelinePage userName={effectiveUser.name} userTeam={effectiveUser.team} />;
      case "followups":  return <FollowupsPage userName={effectiveUser.name} />;
      default:            return <AdminDashboard />;
    }
  }

  return (
    <Shell
      identity={identity}
      currentView={currentView}
      onViewChange={handleViewChange}
      onSignOut={handleSignOut}
      onSetPreviewRole={handleSetPreviewRole}
      onPreviewMember={handlePreviewMember}
      onExitPreview={handleExitPreview}
    >
      {renderPage()}
    </Shell>
  );
}


