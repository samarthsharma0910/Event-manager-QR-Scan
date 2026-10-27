import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/shell";
import { GoogleButton, LoginForm } from "@/components/auth/forms";
import { getCurrentUser, homeFor, safeNext } from "@/lib/auth/session";
import { googleEnabled } from "@/lib/auth/google";

export const metadata: Metadata = { title: "Log in" };

const GOOGLE_ERRORS: Record<string, string> = {
  google_failed: "Google sign-in didn't complete. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified: "Google says that email address isn't verified, so we can't use it.",
  google_staff: "That email belongs to a staff account. Please use the staff sign-in.",
  google_off: "Google sign-in isn't available right now. Please use your email and password.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
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
      {sp.error && GOOGLE_ERRORS[sp.error] && (
        <p role="alert" className="mb-5 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {GOOGLE_ERRORS[sp.error]}
        </p>
      )}
      {googleEnabled() && <GoogleButton next={next && !next.startsWith("/admin") ? next : undefined} />}
      <LoginForm next={next && !next.startsWith("/admin") ? next : undefined} audience="participant" />
      <p className="mt-6 border-t border-line pt-4 text-center text-sm text-muted">
        NGO admin or check-in staff?{" "}
        <Link href="/admin/login" className="font-semibold text-forest hover:underline">Staff sign-in</Link>
      </p>
    </AuthShell>
  );
}
