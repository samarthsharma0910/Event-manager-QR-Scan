"use client";

import Link from "next/link";

/** Never show raw errors or stack traces to visitors. */
export default function ErrorPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold leading-tight">Something went wrong</h1>
      <p className="mt-3 text-muted">
        We hit a problem with this page. It may simply be out of date after an update, so reloading usually fixes it.
      </p>
      <div className="mt-8 flex gap-3">
        {/* A full reload (not a soft retry) also clears a stale page left open across a site update. */}
        <button onClick={() => window.location.reload()} className="btn-primary">Reload page</button>
        <Link href="/" className="btn-secondary">Go home</Link>
      </div>
    </main>
  );
}
