export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { isValidEmail, validatePasswordStrength } from "@/lib/validation";

async function requireAdmin() {
  const session = await getSession();
  if (!session.currentEmail) return null;
  const { data } = await supabaseAdmin
    .from("users").select("role,active").eq("email", session.currentEmail).single();
  return data?.role === "admin" && data?.active ? session.currentEmail : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data: users } = await supabaseAdmin
    .from("users").select("email,name,role,team,temp_password,active").order("name");
  const { data: teams } = await supabaseAdmin.from("teams").select("name").order("name");
  return NextResponse.json({ users: users ?? [], teams: (teams ?? []).map((t: {name:string}) => t.name) });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  if (action === "register") {
    const { email, name, role, team, tempPassword } = body;
    if (!email || !name || !role || !team || !tempPassword)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    if (!isValidEmail(email.trim().toLowerCase()))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!["setter","closer"].includes(role))
      return NextResponse.json({ error: "Role must be Setter or Closer." }, { status: 400 });

    const { data: teamRow } = await supabaseAdmin.from("teams").select("name").eq("name", team).single();
    if (!teamRow) return NextResponse.json({ error: "Select a valid team." }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("users").select("email").eq("email", email.trim().toLowerCase()).single();
    if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 400 });

    // Check pair capacity
    const { data: pairMembers } = await supabaseAdmin
      .from("users").select("email").eq("team", team).eq("role", role).eq("active", true);
    if (pairMembers && pairMembers.length > 0)
      return NextResponse.json({ error: `${team} already has an active ${role}.` }, { status: 400 });

    const { data: hashed } = await supabaseAdmin.rpc("hash_password", { plain: tempPassword });
    await supabaseAdmin.from("users").insert({
      email: email.trim().toLowerCase(), name, role, team,
      password_hash: hashed, temp_password: true, active: true,
    });
    return NextResponse.json({ ok: true, message: `Registered ${name} (${role}) into ${team}.` });
  }

  if (action === "deactivate") {
    const { email } = body;
    await supabaseAdmin.from("users").update({ active: false }).eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (action === "reactivate") {
    const { email } = body;
    await supabaseAdmin.from("users").update({ active: true }).eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset_password") {
    const { email, tempPassword } = body;
    if (!tempPassword) return NextResponse.json({ error: "Temporary password required." }, { status: 400 });
    const { data: hashed } = await supabaseAdmin.rpc("hash_password", { plain: tempPassword });
    await supabaseAdmin.from("users").update({ password_hash: hashed, temp_password: true }).eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const { email, name, role, team, active } = body;
    if (!name || name.length < 2) return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    if (!["setter","closer"].includes(role)) return NextResponse.json({ error: "Role must be Setter or Closer." }, { status: 400 });
    // Check capacity conflict excluding self
    if (active && team) {
      const { data: conflict } = await supabaseAdmin
        .from("users").select("email").eq("team", team).eq("role", role).eq("active", true).neq("email", email);
      if (conflict && conflict.length > 0)
        return NextResponse.json({ error: `${team} already has an active ${role}.` }, { status: 400 });
    }
    await supabaseAdmin.from("users").update({ name, role, team: team || "", active }).eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { email } = body;
    const session = await getSession();
    if (email === session.currentEmail)
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    const { data: target } = await supabaseAdmin.from("users").select("role").eq("email", email).single();
    if (target?.role === "admin")
      return NextResponse.json({ error: "Admin accounts cannot be deleted." }, { status: 400 });
    await supabaseAdmin.from("users").delete().eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (action === "assign_member") {
    const { team, role, email } = body;
    const { data: conflict } = await supabaseAdmin
      .from("users").select("email,name").eq("team", team).eq("role", role).eq("active", true).neq("email", email);
    if (conflict && conflict.length > 0)
      return NextResponse.json({ error: `${team} already has an active ${role}.` }, { status: 400 });
    await supabaseAdmin.from("users").update({ team }).eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (action === "unassign_member") {
    const { email } = body;
    await supabaseAdmin.from("users").update({ team: "" }).eq("email", email);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
