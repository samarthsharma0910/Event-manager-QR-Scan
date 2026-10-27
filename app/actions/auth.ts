"use server";

import bcrypt from "bcryptjs";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AuthError, authorizeUser, endSession, homeFor, safeNext, startSession } from "@/lib/auth/session";
import { mailEnabled } from "@/lib/mail";
import { isStaffRole } from "@/lib/permissions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeVerificationToken, sendVerificationEmail } from "@/lib/services/verification";
import { loginSchema, signupSchema, zodState, type ActionState } from "@/lib/validation";

// Compared against when the email is unknown so response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

/**
 * Cheap bot filter for public forms: a hidden field real people never fill in, plus a render timestamp so
 * instant machine submissions are refused. Real rate limiting happens separately, per IP.
 */
function looksLikeBot(fd: FormData) {
  if (String(fd.get("homepage") ?? "").length > 0) return true;
  const age = Date.now() - Number(fd.get("ts"));
  return !Number.isFinite(age) || age < 1000 || age > 2 * 86400000;
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  if (looksLikeBot(fd)) return { error: "We couldn't verify this request. Please wait a moment and try again." };
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodState(parsed.error);

  const ip = await clientIp();
  if (!(await rateLimit(`signup:${ip}`, 10, 3600)).ok) {
    return { error: "Too many sign-up attempts. Please try again in a little while." };
  }

  const { name, email, phone, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "An account with this email already exists. Try logging in instead.", fieldErrors: { email: ["This email is already registered."] } };
  }
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      role: "PARTICIPANT",
      // With no mail service configured there is nothing to verify against, so the address is accepted as given.
      emailVerifiedAt: mailEnabled() ? null : new Date(),
    },
  });
  if (mailEnabled()) after(() => sendVerificationEmail(user));
  await startSession(user.id, user.role);
  redirect(safeNext(String(fd.get("next") ?? "")) ?? "/portal");
}

export async function resendVerificationAction(): Promise<ActionState> {
  let user;
  try {
    user = await authorizeUser();
  } catch (e) {
    if (e instanceof AuthError) return { error: "Please log in again.", redirectTo: "/login" };
    throw e;
  }
  if (user.emailVerifiedAt) return { ok: true, message: "Your email is already confirmed." };
  if (!mailEnabled()) return { error: "Email isn't set up on this site yet, so we can't send a confirmation link." };
  if (!(await rateLimit(`verify:${user.id}`, 3, 3600)).ok) return { error: "You've requested several emails already. Please check your inbox and spam folder, or try again in an hour." };
  await sendVerificationEmail(user);
  return { ok: true, message: `We've sent a confirmation link to ${user.email}.` };
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodState(parsed.error);
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const [byIp, byEmail] = await Promise.all([rateLimit(`login-ip:${ip}`, 30, 900), rateLimit(`login-email:${email}`, 8, 900)]);
  if (!byIp.ok || !byEmail.ok) return { error: "Too many login attempts. Please wait a few minutes and try again." };

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { error: "That email and password don't match. Please try again." };

  // Two separate entrances: /login (participants) and /admin/login (staff). Each refuses the other's accounts,
  // and no session is created on a mismatch.
  const audience = fd.get("audience") === "staff" ? "staff" : "participant";
  const staff = isStaffRole(user.role);
  if (audience === "staff" && !staff) {
    return { error: "This sign-in is for NGO staff. Participants can log in from the main Log in page." };
  }
  if (audience === "participant" && staff) {
    return { error: "This is a staff account. Please use the staff sign-in instead." };
  }

  await startSession(user.id, user.role);
  const next = safeNext(String(fd.get("next") ?? ""));
  const allowed = next && (audience === "staff" ? next.startsWith("/admin") : !next.startsWith("/admin"));
  redirect(allowed ? next : homeFor(user.role));
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

/** Called from the confirmation page's button (not on page load, so email link scanners can't use up the token). */
export async function confirmEmailAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const ip = await clientIp();
  if (!(await rateLimit(`confirm:${ip}`, 20, 3600)).ok) return { error: "Too many attempts. Please try again later." };
  const result = await consumeVerificationToken(String(fd.get("token") ?? ""));
  if (result.ok) return { ok: true, message: "Thank you — your email address is confirmed. You can now register for events." };
  return { error: result.reason === "expired" ? "This link has expired. Log in and request a new confirmation email from your profile." : "This link isn't valid or has already been used. If you've already confirmed your email, you're all set." };
}
