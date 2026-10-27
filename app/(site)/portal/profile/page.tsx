import type { Metadata } from "next";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/auth/account-forms";
import { ProfileForm } from "@/components/auth/profile-form";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/portal/profile");
  const profile = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="mx-auto max-w-2xl space-y-14">
      <section aria-labelledby="details">
        <h1 id="details" className="text-4xl font-semibold leading-[1.05] sm:text-5xl">Your profile</h1>
        <p className="mt-3 text-lg text-muted">These details prefill your event registrations.</p>
        <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <ProfileForm user={user} interests={profile?.interests ?? []} />
        </div>
      </section>

      <section aria-labelledby="security">
        <h2 id="security" className="text-2xl font-semibold sm:text-3xl">Password</h2>
        <p className="mt-2 text-muted">Changing your password signs you out of every other device.</p>
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <ChangePasswordForm />
        </div>
      </section>

      <section aria-labelledby="danger">
        <h2 id="danger" className="text-2xl font-semibold sm:text-3xl">Your data</h2>
        <p className="mb-6 mt-2 text-muted">You can delete your account and everything linked to it at any time.</p>
        <DeleteAccountForm />
      </section>

      <form action={logoutAction} className="md:hidden">
        <button className="btn-secondary w-full">Log out</button>
      </form>
    </div>
  );
}
