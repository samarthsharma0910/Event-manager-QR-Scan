import type { Metadata } from "next";
import Link from "next/link";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/motion";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/datetime";
import { VOLUNTEER_INTERESTS } from "@/lib/event-state";
import { listPublicEvents } from "@/lib/services/events";

export const metadata: Metadata = { title: "Become a volunteer" };

export default async function VolunteerPage() {
  const [user, events] = await Promise.all([getCurrentUser(), listPublicEvents({ when: "upcoming" }, 12)]);
  const needing = events.filter((e) => e.volunteerRequirements && e.state === "OPEN");
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-forest-deep text-white">
        <CoverImage src="/photos/volunteer.jpg" alt="" eager className="absolute inset-0 -z-10 size-full opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep via-forest-deep/70 to-transparent" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <h1 className="max-w-2xl animate-rise text-4xl font-semibold leading-[1.04] text-white sm:text-6xl">Give a few hours. Change a neighbourhood.</h1>
          <p className="mt-5 max-w-lg animate-rise text-lg text-white/80 [animation-delay:80ms]">
            Volunteers are the backbone of every initiative. Tell us what you enjoy and we&apos;ll match you with the right role.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:160ms]">
            {user ? (
              <Link href="/portal/profile" className="btn-lg inline-flex min-h-12 items-center rounded-[10px] bg-white px-6 font-semibold text-forest-deep transition-colors hover:bg-mint">Set your volunteer interests</Link>
            ) : (
              <Link href="/register?next=/portal/profile" className="btn-lg inline-flex min-h-12 items-center rounded-[10px] bg-white px-6 font-semibold text-forest-deep transition-colors hover:bg-mint">Create a volunteer account</Link>
            )}
            <Link href="/events" className="inline-flex min-h-12 items-center rounded-[10px] border border-white/40 px-6 font-semibold text-white transition-colors hover:bg-white/10">Browse events</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold sm:text-3xl">Ways to help</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VOLUNTEER_INTERESTS.map((v, i) => (
            <Reveal as="li" key={v} delay={(i % 3) * 70} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 font-medium">
              <Icon name="heart" className="size-5 text-clay" /> {v}
            </Reveal>
          ))}
        </ul>

        <h2 className="mt-16 text-2xl font-semibold sm:text-3xl">Events that need volunteers</h2>
        {needing.length ? (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {needing.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{e.title}</p>
                  <p className="text-sm text-muted">{formatDate(e.date, { short: true })} · {e.location}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{e.volunteerRequirements}</p>
                </div>
                <Link href={`/events/${e.slug}`} className="btn-secondary btn-sm shrink-0">View</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted">No volunteer calls are open right now — check back soon.</p>
        )}
      </div>
    </div>
  );
}
