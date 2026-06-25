export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { validatePasswordStrength } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, confirmPassword } = await req.json();

    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 });

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // Hash the new password
    const { data: hashed, error: hashError } = await supabaseAdmin.rpc("hash_password", {
      plain: newPassword,
    });
    if (hashError || !hashed) {
      return NextResponse.json({ error: "Failed to hash password." }, { status: 500 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: hashed, temp_password: false })
      .eq("email", email.trim().toLowerCase());

    if (updateError) {
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    // Fetch user and create session
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .single();

    const session = await getSession();
    session.currentEmail = email.trim().toLowerCase();
    session.previewRole = "";
    session.previewEmail = "";
    await session.save();

    return NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name, role: user.role, team: user.team },
    });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
