import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { User, MemberPreviewOption, Role } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.currentEmail) {
    return NextResponse.json({ authenticated: false });
  }

  const { data: currentUser } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", session.currentEmail)
    .single();

  if (!currentUser || !currentUser.active) {
    session.destroy();
    return NextResponse.json({ authenticated: false });
  }

  const isActualAdmin = currentUser.role === "admin";

  // Compute effective identity
  let effectiveUser: User = currentUser;
  if (isActualAdmin && session.previewEmail) {
    const { data: pm } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", session.previewEmail)
      .single();
    if (pm && pm.active) effectiveUser = pm;
  }

  const effectiveRole: Role = isActualAdmin && session.previewRole
    ? (session.previewRole as Role)
    : (effectiveUser.role as Role);

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    setter: "Setter",
    closer: "Closer",
  };

  // Build member preview options (all active setters + closers)
  let memberPreviewOptions: MemberPreviewOption[] = [];
  if (isActualAdmin) {
    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("role", ["setter", "closer"])
      .eq("active", true);

    memberPreviewOptions = (allUsers ?? []).map((u: User) => ({
      email: u.email,
      name: u.name,
      role: u.role,
      team: u.team,
      role_label: roleLabels[u.role] ?? u.role,
      team_label: u.team || "Unassigned",
      label: `${u.name} · ${roleLabels[u.role] ?? u.role} · ${u.team || "Unassigned"}`,
    }));
  }

  const isPreviewing = isActualAdmin && (!!session.previewRole || !!session.previewEmail);
  const isPreviewingMember = isActualAdmin && !!session.previewEmail;

  return NextResponse.json({
    authenticated: true,
    currentUser: {
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      team: currentUser.team,
    },
    effectiveUser: {
      email: effectiveUser.email,
      name: effectiveUser.name,
      role: effectiveRole,
      team: effectiveUser.team,
    },
    isActualAdmin,
    isPreviewing,
    isPreviewingMember,
    previewRole: session.previewRole ?? "",
    previewEmail: session.previewEmail ?? "",
    previewRoleLabel: roleLabels[session.previewRole ?? ""] ?? "",
    effectiveRoleLabel: roleLabels[effectiveRole] ?? "User",
    memberPreviewOptions,
  });
}
