import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/shell";
import { ResetForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token;
  return (
    <AuthShell title="Choose a new password">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p role="alert" className="text-danger">
          This reset link is missing or invalid. <Link href="/forgot-password" className="font-semibold underline">Request a new one</Link>.
        </p>
      )}
    </AuthShell>
  );
}
