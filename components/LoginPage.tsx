"use client";
import { useState } from "react";
import {
  Gem, LogIn, KeyRound, Info, Shield, Users, CircleAlert, CircleCheck,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onLogin: (user: { email: string; name: string; role: string; team: string }) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password reset state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error); return; }
      if (data.requiresReset) {
        setResetEmail(data.email);
        setShowReset(true);
        setEmail(""); setPassword("");
        return;
      }
      onLogin(data.user);
    } catch {
      setLoginError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error); return; }
      toast.success("Password updated successfully!");
      onLogin(data.user);
    } catch {
      setResetError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function cancelReset() {
    setShowReset(false); setResetEmail(""); setNewPassword(""); setConfirmPassword(""); setResetError("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full font-['Halis','Inter',sans-serif] text-[#1a1a1a]">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-center px-12 py-12 bg-[#0f0f0f] relative overflow-hidden">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-md bg-[#1a1a1a] flex items-center justify-center">
              <Gem className="h-6 w-6 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-[0.25em] text-white leading-none font-['Adorn_Condensed','Halis','Inter',sans-serif]">SHINING</p>
              <p className="text-[12px] font-medium tracking-[0.35em] text-[#d4af37] mt-1.5">OVERSEAS</p>
            </div>
          </div>
          <p className="text-[11px] font-semibold tracking-[0.35em] text-[#d4af37] mb-3">LEAD ENGINE</p>
          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] leading-[1.05] mb-5">
            Operations Command Center
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
            A purpose-built workspace for admins, setters, and closers to qualify, route, and convert leads with precision.
          </p>
          <div className="flex flex-col gap-3 mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-[#d4af37] shrink-0" />
              <p className="text-xs text-neutral-400">Admin-controlled access · local-only authentication</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-[#d4af37] shrink-0" />
              <p className="text-xs text-neutral-400">Roles for admins, setters, and closers</p>
            </div>
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-[#d4af37] shrink-0" />
              <p className="text-xs text-neutral-400">First-login password setup for new accounts</p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 tracking-wider absolute bottom-8 left-12">
          © Shining Overseas · Internal use only
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12 bg-[#fdfbf6] min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-md bg-[#1a1a1a] flex items-center justify-center">
              <Gem className="h-5 w-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-[0.2em] text-[#1a1a1a] leading-none font-['Adorn_Condensed','Halis','Inter',sans-serif]">SHINING</p>
              <p className="text-[10px] font-medium tracking-[0.3em] text-[#d4af37] mt-1">OVERSEAS</p>
            </div>
          </div>

          <p className="text-[10px] font-semibold tracking-[0.3em] text-[#d4af37] mb-2">WELCOME BACK</p>
          <h2 className="text-3xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif] mb-2">
            {showReset ? "Update your password" : "Sign in to your workspace"}
          </h2>
          <p className="text-sm text-neutral-500 mb-8">
            {showReset
              ? "Replace your temporary password with a permanent one to access your workspace."
              : "Use the email address registered by your administrator."}
          </p>

          {showReset ? (
            <form onSubmit={handleResetPassword} className="w-full">
              <div className="mb-5 p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="h-4 w-4 text-[#8a6d1a]" />
                  <p className="text-sm font-semibold text-[#1a1a1a]">Set a new password</p>
                </div>
                <p className="text-xs text-neutral-500">You&apos;re signing in with a temporary password. Choose a new password to continue.</p>
              </div>
              <div className="mb-4">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">NEW PASSWORD</p>
                <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setResetError(""); }}
                  placeholder="At least 8 characters" autoComplete="new-password" required
                  className="w-full px-4 py-3 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30" />
              </div>
              <div className="mb-3">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">CONFIRM PASSWORD</p>
                <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setResetError(""); }}
                  placeholder="Re-enter your new password" autoComplete="new-password" required
                  className="w-full px-4 py-3 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30" />
              </div>
              <div className="mb-4">
                <p className="text-[11px] text-neutral-500">• Minimum 8 characters</p>
                <p className="text-[11px] text-neutral-500">• At least one uppercase, lowercase, and number</p>
              </div>
              {resetError && (
                <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-red-50 border border-red-200 rounded-md">
                  <CircleAlert className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{resetError}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={cancelReset}
                  className="px-4 py-3 rounded-md bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#1a1a1a] text-[#d4af37] border border-[#d4af37]/40 hover:bg-[#2a2a2a] transition-colors disabled:opacity-60">
                  <CircleCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold tracking-wide">{loading ? "Updating…" : "Update Password"}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="w-full">
              <div className="mb-4">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">EMAIL ADDRESS</p>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setLoginError(""); }}
                  placeholder="you@example.com" autoComplete="email" required
                  className="w-full px-4 py-3 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30" />
              </div>
              <div className="mb-4">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">PASSWORD</p>
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                  placeholder="Enter your password" autoComplete="current-password" required
                  className="w-full px-4 py-3 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30" />
              </div>
              {loginError && (
                <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-red-50 border border-red-200 rounded-md">
                  <CircleAlert className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{loginError}</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#1a1a1a] text-[#d4af37] border border-[#d4af37]/40 hover:bg-[#2a2a2a] transition-colors disabled:opacity-60">
                <LogIn className="h-4 w-4" />
                <span className="text-sm font-semibold tracking-wide">{loading ? "Signing in…" : "Sign In"}</span>
              </button>
              <div className="mt-8 p-3.5 bg-[#faf8f3] border border-[#d4af37]/20 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-[#8a6d1a] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a1a]">Need an account?</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                      Accounts are provisioned by your administrator. Contact them to receive your email and temporary password.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
