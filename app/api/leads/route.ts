import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { FollowupItem } from "@/types";

export const dynamic = "force-dynamic";

async function getEffectiveUser() {
  const session = await getSession();
  if (!session.currentEmail) return null;

  const { data: currentUser } = await supabaseAdmin
    .from("users").select("*").eq("email", session.currentEmail).single();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === "admin";
  if (isAdmin && session.previewEmail) {
    const { data: pm } = await supabaseAdmin
      .from("users").select("*").eq("email", session.previewEmail).single();
    if (pm && pm.active) return { user: pm, isAdmin };
  }
  return { user: currentUser, isAdmin };
}

export async function GET(req: NextRequest) {
  const ctx = await getEffectiveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user, isAdmin } = ctx;
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "all";

  let query = supabaseAdmin.from("leads").select("*");

  if (scope === "setter_queue") {
    query = query.eq("setter", user.name);
  } else if (scope === "closer_pipeline") {
    query = query.eq("closer", user.name).in("setter_status", ["qualified", "appointment_fixed"]);
  } else if (scope === "followups") {
    // Fetch leads with pending followups for this user
    const userFilter = user.role === "setter" ? { setter: user.name } : { closer: user.name };
    query = query.match(userFilter).not("appointment_date", "eq", "").not("followups", "eq", null);
  } else if (!isAdmin) {
    // Non-admins only see their own leads
    if (user.role === "setter") query = query.eq("setter", user.name);
    else if (user.role === "closer") query = query.eq("closer", user.name);
  }

  const { data: leads, error } = await query.order("assigned_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also return batches (filtered by role)
  let batches = null;
  if (scope === "setter_queue") {
    const { data: b } = await supabaseAdmin.from("lead_batches").select("*").eq("setter", user.name).order("assigned_at", { ascending: false }).limit(20);
    batches = b;
  } else if (scope === "closer_pipeline") {
    const { data: b } = await supabaseAdmin.from("lead_batches").select("*").eq("closer", user.name).order("assigned_at", { ascending: false }).limit(20);
    batches = b;
  } else if (isAdmin) {
    const { data: b } = await supabaseAdmin.from("lead_batches").select("*").order("assigned_at", { ascending: false }).limit(20);
    batches = b;
  }

  // Stats
  const allLeads = leads ?? [];
  const stats = {
    total: allLeads.length,
    pending: allLeads.filter((l) => l.setter_status === "pending").length,
    qualified: allLeads.filter((l) => l.setter_status === "qualified" || l.setter_status === "appointment_fixed").length,
    replacements_open: 0,
  };

  // Get open replacements count
  const { count } = await supabaseAdmin.from("replacements").select("*", { count: "exact", head: true }).eq("status", "open");
  stats.replacements_open = count ?? 0;

  return NextResponse.json({ leads: allLeads, batches, stats });
}

function generateFollowups(appointmentDate: string): FollowupItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(appointmentDate + "T00:00:00");
  const followups: FollowupItem[] = [];
  let id = 1;

  // Every 2 days starting from today+2 until day before appointment
  let nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + 2);

  const dayBefore = new Date(apptDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayBeforeStr = dayBefore.toISOString().slice(0, 10);

  while (nextDate < dayBefore) {
    const nextStr = nextDate.toISOString().slice(0, 10);
    followups.push({
      id: String(id++),
      scheduled_date: nextStr,
      scheduled_time: "11:00",
      type: "regular",
      status: "pending",
    });
    nextDate.setDate(nextDate.getDate() + 2);
  }

  // Day before: confirmation calls
  followups.push({
    id: String(id++),
    scheduled_date: dayBeforeStr,
    scheduled_time: "11:00",
    type: "confirmation_am",
    status: "pending",
  });
  followups.push({
    id: String(id++),
    scheduled_date: dayBeforeStr,
    scheduled_time: "20:30",
    type: "confirmation_pm",
    status: "pending",
  });

  // Day of: arrival
  followups.push({
    id: String(id++),
    scheduled_date: appointmentDate,
    scheduled_time: "09:00",
    type: "arrival",
    status: "pending",
  });

  return followups;
}

export async function POST(req: NextRequest) {
  const ctx = await getEffectiveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { user, isAdmin } = ctx;
  const body = await req.json();
  const { action } = body;

  // --- UPLOAD (admin only) ---
  if (action === "upload_batch") {
    if (!isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const { leads, team, source, setter, closer, label } = body;
    if (!leads?.length) return NextResponse.json({ error: "No leads to upload." }, { status: 400 });

    const now = new Date().toISOString().slice(0, 10);
    const nowFull = new Date().toISOString();

    // Insert batch
    const { data: batch } = await supabaseAdmin.from("lead_batches").insert({
      label: label || `Batch ${now}`,
      team, setter, closer, source: source || "",
      lead_count: leads.length,
      assigned_date: now,
      assigned_at: nowFull,
      uploaded_by: user.name,
      origin: "upload",
    }).select().single();

    // Insert leads
    const leadRows = leads.map((l: { name: string; phone: string; notes?: string }) => ({
      name: l.name, phone: l.phone, notes: l.notes || body.notes || "", source: source || "",
      team, setter, closer,
      setter_status: "pending", closer_status: "",
      batch_id: batch.id,
      assigned_date: now, assigned_at: nowFull,
      created_at: nowFull,
    }));
    await supabaseAdmin.from("leads").insert(leadRows);

    // Update batch lead count
    await supabaseAdmin.from("lead_batches").update({ lead_count: leads.length }).eq("id", batch.id);

    return NextResponse.json({ ok: true, batchId: batch.id });
  }

  // --- SETTER: mark called ---
  if (action === "mark_called") {
    const { leadId } = body;
    const { data: lead } = await supabaseAdmin.from("leads").select("called_dates").eq("id", leadId).single();
    const today = new Date().toISOString().slice(0, 10);
    const called = [...(lead?.called_dates ?? [])];
    if (!called.includes(today)) called.push(today);
    await supabaseAdmin.from("leads").update({ called_dates: called }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- SETTER: qualify lead ---
  if (action === "qualify_lead") {
    const { leadId, status } = body;
    const newStatus = status || "qualified";
    const updateData: Record<string, unknown> = { setter_status: newStatus };
    if (newStatus === "qualified" || newStatus === "appointment_fixed") {
      updateData.qualified_at = new Date().toISOString().slice(0, 10);
      updateData.handoff_status = "pending";
    }
    await supabaseAdmin.from("leads").update(updateData).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- SETTER: request replacement ---
  if (action === "request_replacement") {
    const { leadId, leadName, reason } = body;
    const now = new Date().toISOString();
    await supabaseAdmin.from("replacements").insert({
      lead_id: leadId, lead_name: leadName,
      reason, setter: user.name, pair: user.team,
      status: "open", created_at: now,
    });
    return NextResponse.json({ ok: true });
  }

  // --- CLOSER: update touchpoints ---
  if (action === "update_touchpoints") {
    const { leadId, touchpoint, value } = body;
    await supabaseAdmin.from("leads").update({ [touchpoint]: value }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- CLOSER: update closer status ---
  if (action === "update_closer_status") {
    const { leadId, status } = body;
    await supabaseAdmin.from("leads").update({ closer_status: status }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- CLOSER: set appointment (generates followup schedule) ---
  if (action === "set_appointment") {
    const { leadId, date } = body;
    const followups = generateFollowups(date);
    await supabaseAdmin.from("leads").update({ appointment_date: date, followups }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- GENERAL: mark a followup as done ---
  if (action === "mark_followup") {
    const { leadId, followupId } = body;
    const { data: lead } = await supabaseAdmin.from("leads").select("followups").eq("id", leadId).single();
    const updated = (lead?.followups || []).map((f: FollowupItem) =>
      f.id === followupId ? { ...f, status: "done", completed_at: new Date().toISOString(), completed_by: user.name } : f
    );
    await supabaseAdmin.from("leads").update({ followups: updated }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- GENERAL: mark lead as arrived (completes all pending followups) ---
  if (action === "mark_arrived") {
    const { leadId } = body;
    const { data: lead } = await supabaseAdmin.from("leads").select("followups").eq("id", leadId).single();
    const updated = (lead?.followups || []).map((f: FollowupItem) =>
      f.status === "pending" ? { ...f, status: "done", completed_at: new Date().toISOString(), completed_by: user.name } : f
    );
    await supabaseAdmin.from("leads").update({ closer_status: "arrived", followups: updated }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- CLOSER: accept handoff ---
  if (action === "accept_handoff") {
    const { leadId } = body;
    await supabaseAdmin.from("leads").update({
      handoff_status: "accepted",
      closer_status: "new",
      accepted_at: new Date().toISOString(),
    }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- ADMIN: export batch CSV data ---
  if (action === "get_batch_leads") {
    if (!isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const { batchId } = body;
    const { data: leads } = await supabaseAdmin.from("leads").select("*").eq("batch_id", batchId);
    return NextResponse.json({ leads: leads ?? [] });
  }

  // --- ADMIN: pool management ---
  if (action === "add_to_pool") {
    if (!isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const { name, phone, source } = body;
    await supabaseAdmin.from("pool_entries").insert({
      name, phone, source: source || "",
      status: "available", added_by: user.name,
      added_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "get_pool") {
    if (!isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const { data: pool } = await supabaseAdmin.from("pool_entries").select("*").eq("status", "available").order("added_at", { ascending: false });
    return NextResponse.json({ pool: pool ?? [] });
  }

  // --- ADMIN: fulfill replacement ---
  if (action === "fulfill_replacement") {
    if (!isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const { replacementId, poolEntryId, note } = body;

    const { data: pool } = await supabaseAdmin.from("pool_entries").select("*").eq("id", poolEntryId).single();
    if (!pool) return NextResponse.json({ error: "Pool entry not found." }, { status: 404 });

    const { data: rep } = await supabaseAdmin.from("replacements").select("*").eq("id", replacementId).single();
    if (!rep) return NextResponse.json({ error: "Replacement not found." }, { status: 404 });

    const now = new Date().toISOString();

    // Create a new lead from pool entry in the requesting setter's team
    const { data: newLead } = await supabaseAdmin.from("leads").insert({
      name: pool.name, phone: pool.phone, source: pool.source,
      team: rep.pair, setter: rep.setter,
      setter_status: "pending", closer_status: "",
      created_at: now, assigned_date: now.slice(0, 10), assigned_at: now,
    }).select().single();

    // Mark pool entry as used
    await supabaseAdmin.from("pool_entries").update({
      status: "assigned",
      assigned_to_pair: rep.pair,
      assigned_at: now,
    }).eq("id", poolEntryId);

    // Close replacement
    await supabaseAdmin.from("replacements").update({
      status: "fulfilled",
      fulfilled_at: now,
      fulfillment_note: note || "",
      replacement_lead_id: newLead.id,
      replacement_name: pool.name,
      replacement_phone: pool.phone,
      replacement_source: pool.source,
      pool_entry_id: poolEntryId,
    }).eq("id", replacementId);

    return NextResponse.json({ ok: true });
  }

  if (action === "get_replacements") {
    const { data: reps } = await supabaseAdmin.from("replacements").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ replacements: reps ?? [] });
  }

  // --- SETTER: data requests ---
  if (action === "create_data_request") {
    const { reason, requestedCount } = body;
    const now = new Date().toISOString();
    await supabaseAdmin.from("setter_data_requests").insert({
      setter: user.name, team: user.team,
      requested_day: now.slice(0, 10),
      reason, requested_count: requestedCount || 1,
      status: "pending", created_at: now,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "get_data_requests") {
    let q = supabaseAdmin.from("setter_data_requests").select("*").order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("setter", user.name);
    const { data } = await q;
    return NextResponse.json({ requests: data ?? [] });
  }

  if (action === "fulfill_data_request") {
    if (!isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const { requestId, adminNote, fulfilledCount } = body;
    await supabaseAdmin.from("setter_data_requests").update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
      admin_note: adminNote || "",
      fulfilled_count: fulfilledCount || 0,
    }).eq("id", requestId);
    return NextResponse.json({ ok: true });
  }

  // --- SETTER: handoff lead to closer ---
  if (action === "handoff_lead") {
    const { leadId, note } = body;
    const now = new Date().toISOString();
    await supabaseAdmin.from("leads").update({
      handoff_status: "pending",
      handoff_at: now,
      handoff_by: user.name,
      handoff_note: note || "",
    }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  // --- SETTER: update notes ---
  if (action === "update_notes") {
    const { leadId, notes } = body;
    await supabaseAdmin.from("leads").update({ notes }).eq("id", leadId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
