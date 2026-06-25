export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session.currentEmail) return false;
  const { data } = await supabaseAdmin
    .from("users").select("role,active").eq("email", session.currentEmail).single();
  return data?.role === "admin" && data?.active;
}

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data: teams } = await supabaseAdmin.from("teams").select("name").order("name");
  const { data: users } = await supabaseAdmin.from("users").select("email,name,role,team,active").neq("role", "admin");
  return NextResponse.json({ teams: (teams ?? []).map((t: {name:string}) => t.name), users: users ?? [] });
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { name } = body;
    if (!name || name.length < 2) return NextResponse.json({ error: "Team name must be at least 2 characters." }, { status: 400 });
    if (name.length > 40) return NextResponse.json({ error: "Team name must be 40 characters or fewer." }, { status: 400 });
    const { data: existing } = await supabaseAdmin.from("teams").select("name").ilike("name", name).single();
    if (existing) return NextResponse.json({ error: "A team with that name already exists." }, { status: 400 });
    await supabaseAdmin.from("teams").insert({ name });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { name } = body;
    const { data: members } = await supabaseAdmin.from("users").select("email").eq("team", name).eq("active", true);
    if (members && members.length > 0)
      return NextResponse.json({ error: `Cannot delete '${name}': ${members.length} active member(s). Remove them first.` }, { status: 400 });
    await supabaseAdmin.from("teams").delete().eq("name", name);
    await supabaseAdmin.from("users").update({ team: "" }).eq("team", name);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
