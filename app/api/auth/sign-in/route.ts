export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { isValidEmail } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter both your email and password." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // Fetch user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "No account found with that email." }, { status: 401 });
    }
    if (!user.active) {
      return NextResponse.json({ error: "This account has been deactivated. Contact your admin." }, { status: 403 });
    }

    // Verify password via RPC
    const { data: passwordOk } = await supabaseAdmin.rpc("crypt_check", {
      plain: password,
      hashed: user.password_hash,
    });

    if (!passwordOk) {
      return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
    }

    // Temp password — force reset
    if (user.temp_password) {
      return NextResponse.json({ requiresReset: true, email: normalizedEmail });
    }

    // Create session
    const session = await getSession();
    session.currentEmail = normalizedEmail;
    session.previewRole = "";
    session.previewEmail = "";
    await session.save();

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        team: user.team,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
