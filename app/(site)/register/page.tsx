import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/shell";
import { SignupForm } from "@/components/auth/forms";
import { getCurrentUser, homeFor, safeNext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next) ?? undefined;
  const user = await getCurrentUser();
  if (user) redirect(next ?? homeFor(user.role));
  return (
    <AuthShell
      title="Join the community"
      subtitle="Create a free account to register for events and keep your QR tickets in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-forest hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
