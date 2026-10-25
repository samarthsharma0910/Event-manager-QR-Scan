"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { endSession, homeFor, safeNext, startSession } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/permissions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { forgotSchema, loginSchema, resetSchema, signupSchema, zodState, type ActionState } from "@/lib/validation";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
// Compared against when the email is unknown so response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
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
    data: { name, email, phone, passwordHash: await bcrypt.hash(password, 12), role: "PARTICIPANT" },
  });
  await startSession(user.id, user.role);
  redirect(safeNext(String(fd.get("next") ?? "")) ?? "/portal");
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

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodState(parsed.error);

  const ip = await clientIp();
  if (!(await rateLimit(`forgot:${ip}`, 5, 3600)).ok) return { error: "Too many requests. Please try again later." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    // No mail provider is bundled. Plug one in here (Resend, SES, SendGrid…); until then the link is logged server-side.
    console.log(`[password-reset] ${user.email}: ${link}`);
  }
  // Same response whether or not the account exists.
  return { ok: true, message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodState(parsed.error);

  const ip = await clientIp();
  if (!(await rateLimit(`reset:${ip}`, 10, 3600)).ok) return { error: "Too many attempts. Please try again later." };

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } }),
    prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}
