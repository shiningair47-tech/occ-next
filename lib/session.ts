import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData } from "@/types";

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "occ_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export function emptySession(): SessionData {
  return { currentEmail: "", previewRole: "", previewEmail: "" };
}
