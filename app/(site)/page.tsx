import Link from "next/link";
import { EventCard, FeaturedEvent, DateChip } from "@/components/events/event-card";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { Countdown, CountUp, Reveal } from "@/components/ui/motion";
import { EmptyState, Notice, PartnerLogo, flashParams } from "@/components/ui/server";
import { eventStart, formatTime, nowWall } from "@/lib/datetime";
import { listPublicEvents } from "@/lib/services/events";
import { getPublicPartners, getSdgFocus } from "@/lib/services/public";
import { getSettings } from "@/lib/services/settings";
import { getImpactStats } from "@/lib/services/stats";

const STEPS = [
  { n: "01", title: "Pick something that matters to you", body: "Browse upcoming events by cause, date or SDG. Every one is free to join." },
  { n: "02", title: "Reserve your place in a minute", body: "Register once and your personal QR ticket appears in your portal — nothing to print." },
  { n: "03", title: "Show up and scan in", body: "Our team scans your ticket at the door. Your attendance and volunteer hours are recorded for you." },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const flash = flashParams(await searchParams);
  const [settings, events, impact, partners, sdgs] = await Promise.all([
    getSettings(),
    listPublicEvents({ when: "upcoming" }, 3),
    getImpactStats(),
    getPublicPartners(),
    getSdgFocus(),
  ]);
  const focus = sdgs.filter((g) => g.events > 0);
  const next = events.find((e) => e.state === "OPEN") ?? events[0];
  const msUntilNext = next ? eventStart(next).getTime() - nowWall().getTime() : 0;
  const [lead, ...rest] = events;

  const metrics = [
    { label: "Events completed", value: impact.eventsConducted },
    { label: "Volunteers", value: impact.volunteers },
    { label: "People who joined in", value: impact.participants },
    { label: "Hours given to communities", value: impact.communityHours },
  ];

  return (
    <>
      <Notice {...flash} />
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 overflow-x-clip px-4 pb-20 pt-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:pb-28 md:pt-16">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white py-1 pl-1.5 pr-3 text-sm font-medium text-charcoal/80">
            <span className="grid size-5 place-items-center rounded-full bg-forest text-white"><Icon name="leaf" className="size-3" /></span>
            {settings.name}
          </p>
          <h1 className="mt-6 text-[2.9rem] font-semibold leading-[1.02] text-forest-deep sm:text-6xl lg:text-[4.4rem]">{settings.tagline}</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Discover community initiatives, volunteer with purpose, and be part of meaningful change.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/events" className="btn-primary btn-lg w-full sm:w-auto">
              Explore Events <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/volunteer" className="btn-secondary btn-lg w-full sm:w-auto">
              Become a Volunteer
            </Link>
          </div>
          <p className="mt-8 text-sm text-muted">
            <strong className="font-semibold text-charcoal"><CountUp value={impact.participants} /></strong> neighbours have joined an event so far.
          </p>
        </div>

        <div className="relative animate-rise [animation-delay:120ms]">
          <div className="overflow-hidden rounded-[2rem] bg-paper shadow-[0_30px_60px_-30px_rgb(29_42_35/0.45)]">
            <CoverImage src={settings.heroImageUrl} alt={`Volunteers and neighbours with ${settings.shortName}`} eager seed={settings.name} className="aspect-[5/4] w-full" />
          </div>
          {next && (
            <Link
              href={`/events/${next.slug}`}
              className="lift absolute -bottom-7 left-4 right-4 flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_18px_40px_-18px_rgb(29_42_35/0.4)] sm:left-auto sm:right-auto sm:-left-6 sm:w-[21rem]"
            >
              <DateChip date={next.date} className="border border-line shadow-none" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-forest">Next up · starts in <Countdown ms={msUntilNext} /></span>
                <span className="mt-0.5 block truncate font-display text-lg font-semibold leading-tight">{next.title}</span>
                <span className="block truncate text-[0.8125rem] text-muted">{formatTime(next.startTime)} · {next.location}</span>
              </span>
              <Icon name="arrow" className="size-5 shrink-0 text-forest" />
            </Link>
          )}
        </div>
      </section>

      {/* Impact */}
      <section aria-label="Our impact" className="border-y border-line bg-paper">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          {metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 80} className="px-2 md:border-l md:border-line-strong md:pl-8 md:first:border-l-0 md:first:pl-0">
              <dd className="font-display text-5xl font-semibold text-forest-deep"><CountUp value={m.value} /></dd>
              <dt className="mt-1 text-[0.9375rem] text-muted">{m.label}</dt>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Upcoming */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6" aria-labelledby="upcoming">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="upcoming" className="text-3xl font-semibold sm:text-4xl">Coming up</h2>
          <Link href="/events" className="link-arrow">
            See all events <Icon name="arrow" className="size-4" />
          </Link>
        </div>
        <div className="mt-8">
          {lead ? (
            <>
              <Reveal><FeaturedEvent event={lead} /></Reveal>
              {rest.length > 0 && (
                <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
                  {rest.map((e, i) => (
                    <Reveal key={e.id} delay={i * 90}><EventCard event={e} /></Reveal>
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="calendar" title="No upcoming events">
              There aren&apos;t any events open for registration right now. Check back soon.
            </EmptyState>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="max-w-xl text-3xl font-semibold sm:text-4xl">From “I’d like to help” to showing up, in three steps</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} as="li" delay={i * 100} className="border-t border-charcoal pt-5">
              <span className="font-display text-sm font-semibold text-clay">{s.n}</span>
              <h3 className="mt-3 text-xl font-semibold leading-snug">{s.title}</h3>
              <p className="mt-2 text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Partners */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-6" aria-labelledby="partners">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="partners" className="max-w-md text-3xl font-semibold sm:text-4xl">Built with the people around us</h2>
          <Link href="/partners" className="link-arrow">Our partners <Icon name="arrow" className="size-4" /></Link>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {partners.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <PartnerLogo name={p.name} logo={p.logo} size="size-11 shrink-0" />
              <span className="text-sm font-semibold leading-snug">{p.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* SDG focus */}
      <section className="relative mt-28 overflow-hidden bg-forest-deep text-white" aria-labelledby="sdg">
        <CoverImage src="/photos/trees.jpg" alt="" eager={false} className="absolute inset-0 size-full opacity-25 mix-blend-luminosity" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-sm font-semibold text-sage">Sustainable Development Goals</p>
          <h2 id="sdg" className="mt-3 max-w-2xl text-3xl font-semibold sm:text-5xl sm:leading-[1.05]">SDG 17: no one solves local problems alone.</h2>
          <p className="mt-5 max-w-2xl text-lg text-white/75">
            Every initiative here is delivered with partners and mapped to the goals it supports, so you can see how a morning in the park connects to something bigger.
          </p>
          <ul className="mt-9 flex flex-wrap gap-2.5">
            {focus.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/events?sdg=${g.number}&when=all`}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                    g.number === 17 ? "border-white bg-white text-forest-deep hover:bg-mint" : "border-white/25 text-white hover:border-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className="font-display font-semibold">{g.number}</span>
                  {g.title}
                  <span className="text-xs opacity-60">{g.events}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-28 sm:px-6 md:grid-cols-2">
        <Reveal className="overflow-hidden rounded-3xl">
          <CoverImage src="/photos/volunteer.jpg" alt="A volunteer in a bright jersey at an event" className="aspect-[4/3] w-full" />
        </Reveal>
        <Reveal delay={120}>
          <h2 className="text-3xl font-semibold sm:text-5xl sm:leading-[1.05]">Find an opportunity to make an impact.</h2>
          <p className="mt-4 max-w-md text-lg text-muted">Pick an event, reserve your place, and show up with your QR ticket. It takes about a minute.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className="btn-primary btn-lg w-full sm:w-auto">Explore Events</Link>
            <Link href="/register" className="btn-secondary btn-lg">Create an account</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
