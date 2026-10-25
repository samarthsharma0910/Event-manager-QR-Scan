import type { Metadata } from "next";
import Link from "next/link";
import { DateChip } from "@/components/events/event-card";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { Countdown, CountUp, Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/server";
import { requireUser } from "@/lib/auth/session";
import { durationHours, eventStart, formatDate, formatTime, greeting, nowWall } from "@/lib/datetime";
import { qrDataUrl } from "@/lib/qr";
import { getUserRegistrations } from "@/lib/services/registrations";
import { getUserStats } from "@/lib/services/stats";

export const metadata: Metadata = { title: "My Portal" };

export default async function PortalHome() {
  const user = await requireUser("/portal");
  const [stats, regs] = await Promise.all([getUserStats(user.id), getUserRegistrations(user.id)]);

  const today = nowWall();
  today.setUTCHours(0, 0, 0, 0);
  const upcoming = regs.filter((r) => r.event.date >= today && !["COMPLETED", "CANCELLED"].includes(r.event.status));
  const past = regs.filter((r) => !upcoming.includes(r)).reverse();
  const volunteering = regs.filter((r) => r.isVolunteer);
  const next = upcoming[0];
  const nextQr = next ? await qrDataUrl(next.ticketToken, 240) : null;
  const msToNext = next ? eventStart(next.event).getTime() - nowWall().getTime() : 0;

  const statItems = [
    { label: "Events registered", value: stats.registered },
    { label: "Events attended", value: stats.attended },
    { label: "Upcoming events", value: stats.upcoming },
    { label: "Volunteer hours", value: stats.volunteerHours },
  ];

  return (
    <div className="space-y-16">
      <header className="animate-rise">
        <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-lg text-muted">Ready to make an impact?</p>
      </header>

      {next && nextQr && (
        <section aria-label="Your next event" className="-mt-6 animate-rise [animation-delay:80ms]">
          <div className="grid overflow-hidden rounded-3xl border border-line bg-white md:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-56">
              <CoverImage src={next.event.coverImage} alt="" seed={next.event.title} eager className="absolute inset-0 size-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-sm font-semibold text-white/80">Your next event · in <Countdown ms={msToNext} /></p>
                <h2 className="mt-1 text-3xl font-semibold leading-tight text-white">{next.event.title}</h2>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
              <dl className="space-y-3 text-[0.9375rem]">
                <div className="flex items-center gap-3"><Icon name="calendar" className="size-5 text-forest" /><dt className="sr-only">When</dt><dd className="font-semibold">{formatDate(next.event.date, { weekday: true })} · {formatTime(next.event.startTime)}</dd></div>
                <div className="flex items-center gap-3"><Icon name="pin" className="size-5 text-forest" /><dt className="sr-only">Where</dt><dd>{next.event.location}</dd></div>
                <div className="flex items-center gap-3"><Icon name="ticket" className="size-5 text-forest" /><dt className="sr-only">Ticket</dt><dd className="font-mono text-sm">{next.registrationNumber}</dd></div>
              </dl>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nextQr} alt={`QR code for ${next.event.title}`} className="size-24 rounded-lg border border-line p-1" />
                <div className="flex flex-col gap-2">
                  <Link href={`/portal/tickets/${next.id}`} className="btn-primary">Open ticket</Link>
                  <Link href={`/events/${next.event.slug}`} className="link-arrow text-sm">Event details <Icon name="arrow" className="size-4" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <dl className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
        {statItems.map((s, i) => (
          <Reveal key={s.label} delay={i * 70} className="md:border-l md:border-line-strong md:pl-7 md:first:border-l-0 md:first:pl-0">
            <dd className="font-display text-5xl font-semibold text-forest-deep"><CountUp value={s.value} /></dd>
            <dt className="mt-1 text-[0.9375rem] text-muted">{s.label}</dt>
          </Reveal>
        ))}
      </dl>

      <section aria-labelledby="up">
        <div className="flex items-end justify-between">
          <h2 id="up" className="text-2xl font-semibold sm:text-3xl">Upcoming events</h2>
          <Link href="/events" className="link-arrow text-sm">Find more <Icon name="arrow" className="size-4" /></Link>
        </div>
        {upcoming.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {upcoming.map((r) => (
              <li key={r.id} className="group flex items-center gap-4 py-4">
                <DateChip date={r.event.date} className="border border-line shadow-none" />
                <div className="min-w-0 flex-1">
                  <Link href={`/events/${r.event.slug}`} className="block truncate font-display text-lg font-semibold hover:text-forest">{r.event.title}</Link>
                  <p className="truncate text-sm text-muted">{formatTime(r.event.startTime)} · {r.event.location}</p>
                </div>
                <Link href={`/portal/tickets/${r.id}`} className="btn-secondary btn-sm shrink-0">Open ticket</Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5">
            <EmptyState icon="calendar" title="No upcoming events" action={{ href: "/events", label: "Explore events" }}>
              There aren&apos;t any events on your calendar yet. Find one that matters to you.
            </EmptyState>
          </div>
        )}
      </section>

      <section aria-labelledby="tix">
        <div className="flex items-end justify-between">
          <h2 id="tix" className="text-2xl font-semibold sm:text-3xl">My tickets</h2>
          <Link href="/portal/tickets" className="link-arrow text-sm">All tickets <Icon name="arrow" className="size-4" /></Link>
        </div>
        {regs.length ? (
          <p className="mt-3 text-muted">
            You hold {regs.length} {regs.length === 1 ? "ticket" : "tickets"}. Open one on event day and show the QR code to the check-in team.
          </p>
        ) : (
          <div className="mt-5">
            <EmptyState icon="ticket" title="Your tickets will appear here" action={{ href: "/events", label: "Explore events" }}>
              Register for an event to receive your digital ticket.
            </EmptyState>
          </div>
        )}
      </section>

      <section aria-labelledby="past">
        <h2 id="past" className="text-2xl font-semibold sm:text-3xl">Past events</h2>
        {past.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {past.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.event.title}</p>
                  <p className="text-sm text-muted">{formatDate(r.event.date)}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold ${r.attendance ? "text-forest" : "text-muted"}`}>
                  <i aria-hidden="true" className={`size-2 rounded-full ${r.attendance ? "bg-forest" : "bg-muted/40"}`} />
                  {r.attendance ? "Attended" : "Did not attend"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5">
            <EmptyState icon="leaf" title="No attendance yet">Your event participation will appear here.</EmptyState>
          </div>
        )}
      </section>

      <section aria-labelledby="vol">
        <h2 id="vol" className="text-2xl font-semibold sm:text-3xl">My volunteer activity</h2>
        {volunteering.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {volunteering.map((r) => {
              const hours = durationHours(r.event.startTime, r.event.endTime);
              return (
                <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{r.event.title}</p>
                    <p className="text-sm text-muted">{r.volunteerInterest} · {formatDate(r.event.date, { short: true })}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-forest">{r.attendance ? `${hours} hrs logged` : `${hours} hrs planned`}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-5">
            <EmptyState icon="heart" title="No volunteer activity yet" action={{ href: "/volunteer", label: "Become a volunteer" }}>
              Choose a volunteer role when you register and your hours will be recorded here after check-in.
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
