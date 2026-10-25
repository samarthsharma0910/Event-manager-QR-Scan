import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/shell";
import { LoginForm } from "@/components/auth/forms";
import { getCurrentUser, homeFor, safeNext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next) ?? undefined;
  const user = await getCurrentUser();
  if (user) redirect(next && !next.startsWith("/admin") ? next : homeFor(user.role));
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your tickets and upcoming events."
      footer={
        <>
          New here?{" "}
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-forest hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {sp.reset && (
        <p role="status" className="mb-5 rounded-lg bg-mint px-4 py-3 text-sm text-forest-dark">
          Your password has been updated. Please log in.
        </p>
      )}
      <LoginForm next={next && !next.startsWith("/admin") ? next : undefined} audience="participant" />
      <p className="mt-6 border-t border-line pt-4 text-center text-sm text-muted">
        NGO admin or check-in staff?{" "}
        <Link href="/admin/login" className="font-semibold text-forest hover:underline">Staff sign-in</Link>
      </p>
    </AuthShell>
  );
}
