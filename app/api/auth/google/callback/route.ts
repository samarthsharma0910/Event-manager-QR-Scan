import { randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { homeFor, safeNext, startSession } from "@/lib/auth/session";
import { GOOGLE_STATE_COOKIE, fetchGoogleProfile, googleEnabled } from "@/lib/auth/google";
import { appUrl } from "@/lib/mail";
import { isStaffRole } from "@/lib/permissions";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const fail = (code: string) => {
  const res = NextResponse.redirect(`${appUrl()}/login?error=${code}`);
  res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
  return res;
};

function sameState(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Step 2: Google sends the person back here with a one-time code. */
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return fail("google_off");
  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return fail("google_cancelled");

  let saved: { state?: string; next?: string | null } = {};
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "{}");
  } catch {
    /* fall through to the state check */
  }
  const state = sp.get("state") ?? "";
  const code = sp.get("code");
  if (!code || !saved.state || !sameState(saved.state, state)) return fail("google_failed");
  if (!(await rateLimit(`google:${await clientIp()}`, 30, 900)).ok) return fail("google_failed");

  const profile = await fetchGoogleProfile(code);
  if (!profile) return fail("google_failed");
  // Only trust an address Google itself has verified; otherwise anyone could claim someone else's email.
  if (!profile.email_verified) return fail("google_unverified");

  let user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (user && isStaffRole(user.role)) return fail("google_staff"); // staff use their own sign-in
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: (profile.name || profile.email.split("@")[0]).slice(0, 100),
        email: profile.email,
        // No password: this account signs in with Google. The random hash can never be matched.
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
        image: profile.picture ?? null,
        emailVerifiedAt: new Date(),
        role: "PARTICIPANT",
      },
    });
  } else if (!user.emailVerifiedAt || (!user.image && profile.picture)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date(), image: user.image ?? profile.picture ?? null },
    });
  }

  await startSession(user.id, user.role);
  const next = safeNext(saved.next);
  const res = NextResponse.redirect(`${appUrl()}${next && !next.startsWith("/admin") ? next : homeFor(user.role)}`);
  res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
  return res;
}
