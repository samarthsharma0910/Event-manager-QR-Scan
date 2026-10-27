"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction, signupAction } from "@/app/actions/auth";
import { SubmitButton, useSubmit } from "@/components/ui/client";
import { Field, FormError } from "@/components/ui/server";
import type { ActionState } from "@/lib/validation";

const inv = (s: ActionState, k: string) => (s.fieldErrors?.[k] ? true : undefined);

export function LoginForm({ next, audience = "participant" }: { next?: string; audience?: "participant" | "staff" }) {
  const [s, action, busy] = useActionState(loginAction, {});
  const submit = useSubmit(action);
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="audience" value={audience} />
      <FormError message={s.error} />
      <Field label="Email" name="email" errors={s.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-invalid={inv(s, "email")} aria-describedby="email-error" />
      </Field>
      <Field label="Password" name="password" errors={s.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" aria-invalid={inv(s, "password")} aria-describedby="password-error" />
      </Field>
      <SubmitButton busy={busy} pending="Signing in…" className="btn-primary w-full">{audience === "staff" ? "Sign in to staff area" : "Log in"}</SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [s, action, busy] = useActionState(signupAction, {});
  const submit = useSubmit(action);
  // Bot trap: the timestamp is set on the client after the form is shown; "homepage" is a field only scripts fill in.
  const [ts, setTs] = useState(0);
  useEffect(() => setTs(Date.now()), []);
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="ts" value={ts} />
      <div aria-hidden="true" className="absolute -left-[9999px] size-0 overflow-hidden">
        <label>Leave this field empty<input name="homepage" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <FormError message={s.error} />
      <Field label="Full name" name="name" errors={s.fieldErrors?.name}>
        <input id="name" name="name" autoComplete="name" required className="input" aria-invalid={inv(s, "name")} aria-describedby="name-error" />
      </Field>
      <Field label="Email" name="email" errors={s.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-invalid={inv(s, "email")} aria-describedby="email-error" />
      </Field>
      <Field label="Phone (optional)" name="phone" errors={s.fieldErrors?.phone}>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" aria-invalid={inv(s, "phone")} aria-describedby="phone-error" />
      </Field>
      <Field label="Password" name="password" errors={s.fieldErrors?.password} hint="At least 8 characters, with a letter and a number.">
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" aria-invalid={inv(s, "password")} aria-describedby="password-error password-hint" />
      </Field>
      <p className="text-sm text-muted">By creating an account you agree to the <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-forest underline">terms</a> and <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-forest underline">privacy policy</a>.</p>
      <SubmitButton busy={busy} pending="Creating your account…" className="btn-primary w-full">Create account</SubmitButton>
    </form>
  );
}


function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** "Continue with Google" — a plain link: the whole OAuth exchange happens on the server (app/api/auth/google). */
export function GoogleButton({ next }: { next?: string }) {
  return (
    <div className="mb-6">
      <a href={next ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/api/auth/google"} className="btn-secondary flex w-full items-center justify-center gap-3">
        <GoogleG /> Continue with Google
      </a>
      <p className="mt-5 flex items-center gap-3 text-xs tracking-widest text-muted uppercase" role="separator">
        <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
      </p>
    </div>
  );
}
