import type { Metadata } from "next";
import { ProfileForm } from "@/components/auth/profile-form";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/portal/profile");
  const profile = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-2 text-muted">These details prefill your event registrations.</p>
      <div className="mt-8 rounded-lg border border-line bg-white p-6 sm:p-8">
        <ProfileForm user={user} interests={profile?.interests ?? []} />
      </div>
      <form action={logoutAction} className="mt-6 md:hidden">
        <button className="btn-secondary w-full">Log out</button>
      </form>
    </div>
  );
}
