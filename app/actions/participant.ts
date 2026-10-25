"use server";

// No revalidatePath() here on purpose: every route is force-dynamic (see app/layout.tsx), so data is always fresh,
// and revalidating right before redirect() stops the client from following the redirect.

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AuthError, authorizeUser } from "@/lib/auth/session";
import { registrationSchema, profileSchema, zodState, type ActionState } from "@/lib/validation";
import { cancelRegistration, registerForEvent } from "@/lib/services/registrations";

const REGISTER_MESSAGES = {
  NOT_FOUND: "We couldn't find that event.",
  CLOSED: "This event is no longer accepting registrations.",
  FULL: "This event is full.",
  NOT_OPEN: "Registration for this event hasn't opened yet.",
  ENDED: "This event has already taken place.",
  CANCELLED: "This event has been cancelled.",
} as const;

export async function registerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let user;
  try {
    user = await authorizeUser();
  } catch (e) {
    if (e instanceof AuthError) return { error: "Please log in to register.", redirectTo: "/login" };
    throw e;
  }

  const parsed = registrationSchema.safeParse({ ...Object.fromEntries(fd), consent: fd.get("consent") ?? "" });
  if (!parsed.success) return zodState(parsed.error);
  const { eventId, consent: _consent, ...input } = parsed.data;

  let result;
  try {
    result = await registerForEvent(user.id, eventId, input);
  } catch (e) {
    console.error("registerForEvent failed", e);
    return { error: "We couldn't complete your registration. Please try again." };
  }

  if (!result.ok) {
    if (result.code === "ALREADY_REGISTERED") redirect(`/portal/tickets/${result.registrationId}`);
    return { error: REGISTER_MESSAGES[result.code] };
  }

  // Remember contact details for next time.
  await prisma.user.update({
    where: { id: user.id },
    data: { phone: input.phone, organization: input.organization ?? undefined, city: input.city ?? undefined },
  });
  redirect(`/portal/registered/${result.registrationId}`);
}

export async function cancelRegistrationAction(fd: FormData) {
  let user;
  try {
    user = await authorizeUser();
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }
  const id = String(fd.get("registrationId") ?? "");
  const result = await cancelRegistration(id, { userId: user.id });
  if (!result.ok) {
    return { redirectTo: `/portal/tickets?error=${result.code === "ATTENDED" ? "err_attended" : "err_cancel_failed"}&t=${Date.now()}` };
  }
  return { redirectTo: `/portal/tickets?notice=cancel_ok&t=${Date.now()}` };
}

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let user;
  try {
    user = await authorizeUser();
  } catch (e) {
    if (e instanceof AuthError) return { error: "Please log in again.", redirectTo: "/login" };
    throw e;
  }
  const parsed = profileSchema.safeParse({ ...Object.fromEntries(fd), interests: fd.getAll("interests") });
  if (!parsed.success) return zodState(parsed.error);
  const { interests, ...rest } = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: rest.name, phone: rest.phone ?? null, organization: rest.organization ?? null, city: rest.city ?? null, image: rest.image ?? null },
    }),
    prisma.volunteerProfile.upsert({ where: { userId: user.id }, update: { interests }, create: { userId: user.id, interests } }),
  ]);
  return { ok: true, message: "Your profile has been saved." };
}
