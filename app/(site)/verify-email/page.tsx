import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/shell";
import { ConfirmEmailForm } from "@/components/auth/account-forms";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token;
  return (
    <AuthShell title="Confirm your email" subtitle="One more tap and you're ready to register for events.">
      {token ? (
        <ConfirmEmailForm token={token} />
      ) : (
        <p role="alert" className="text-danger">
          This link is missing its code. Open the link from your email again, or <Link href="/portal/profile" className="font-semibold underline">request a new one</Link>.
        </p>
      )}
    </AuthShell>
  );
}
