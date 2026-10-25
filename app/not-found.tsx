import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted">The link may be out of date, or the event may no longer be available.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">Go home</Link>
        <Link href="/events" className="btn-secondary">Browse events</Link>
      </div>
    </main>
  );
}
