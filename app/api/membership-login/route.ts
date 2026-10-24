import { NextRequest, NextResponse } from "next/server";
import { verifyMembershipLink, mintSessionToken } from "@/lib/membershipAuth";
import { normalizeEmail } from "@/lib/supabaseAdmin";

// Verifies the short-lived (5 minute) signed link WordPress generates for
// an active member, and if valid, mints this tool's own longer-lived
// session token - see lib/membershipAuth.ts for why there are two tokens
// instead of one. Called once, right when /tool loads with membership
// link params in the URL.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const exp = typeof body?.exp === "string" ? body.exp : "";
  const token = typeof body?.token === "string" ? body.token : "";

  if (!email || !name || !exp || !token) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!verifyMembershipLink({ email, name, exp, token })) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const normalizedEmail = normalizeEmail(email);
  const session = mintSessionToken(normalizedEmail);
  if (!session) {
    console.error("membership-login: missing MEMBERSHIP_LINK_SECRET");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: normalizedEmail,
    name: name.trim(),
    sessionToken: session.token,
    sessionExp: session.exp,
  });
}
