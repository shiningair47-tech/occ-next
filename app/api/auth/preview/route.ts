export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

async function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.currentEmail) return false;
  const { data } = await supabaseAdmin
    .from("users")
    .select("role, active")
    .eq("email", session.currentEmail)
    .single();
  return data?.role === "admin" && data?.active;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const isAdmin = await requireAdmin(session);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { action, role, email } = await req.json();

  if (action === "set_role") {
    session.previewRole = role === session.previewRole ? "" : (role ?? "");
    session.previewEmail = "";
    await session.save();
    return NextResponse.json({ ok: true });
  }

  if (action === "preview_member") {
    session.previewEmail = email ?? "";
    session.previewRole = "";
    await session.save();
    return NextResponse.json({ ok: true });
  }

  if (action === "exit") {
    session.previewRole = "";
    session.previewEmail = "";
    await session.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
