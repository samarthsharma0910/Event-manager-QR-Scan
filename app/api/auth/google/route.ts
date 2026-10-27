import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/session";
import { GOOGLE_STATE_COOKIE, googleEnabled, googleRedirectUri } from "@/lib/auth/google";
import { appUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

/** Step 1: send the participant to Google. A random `state` (kept in a short-lived cookie) ties the reply to this browser. */
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(`${appUrl()}/login?error=google_off`);
  const state = randomBytes(24).toString("base64url");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next: next && !next.startsWith("/admin") ? next : null }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
