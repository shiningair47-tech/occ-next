import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.currentEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users").select("*").eq("email", session.currentEmail).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  
  // Check if admin is previewing someone
  let effectiveUser = user;
  if (isAdmin && session.previewEmail) {
    const { data: pm } = await supabaseAdmin
      .from("users").select("*").eq("email", session.previewEmail).single();
    if (pm && pm.active) effectiveUser = pm;
  } else if (isAdmin && session.previewRole) {
    // Role preview — use the admin's own name but with previewed role filter
    effectiveUser = { ...user, role: session.previewRole };
  }

  // Fetch leads with appointment_date and followups, scoped to the user
  const userField = effectiveUser.role === "setter" ? "setter" : "closer";
  let query = supabaseAdmin
    .from("leads")
    .select("name, followups")
    .eq(userField, effectiveUser.name)
    .not("appointment_date", "eq", "")
    .not("followups", "eq", null);

  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  let pending = 0;
  let overdue = 0;
  let dueToday = 0;
  const overdueLeads: string[] = [];

  for (const lead of (leads || [])) {
    const followups = (lead.followups || []) as Array<{ scheduled_date: string; status: string }>;
    for (const f of followups) {
      if (f.status !== "pending") continue;
      pending++;
      if (f.scheduled_date < today) {
        overdue++;
        if (!overdueLeads.includes(lead.name)) overdueLeads.push(lead.name);
      } else if (f.scheduled_date === today) {
        dueToday++;
      }
    }
  }

  return NextResponse.json({ pending, overdue, dueToday, overdueLeads });
}
