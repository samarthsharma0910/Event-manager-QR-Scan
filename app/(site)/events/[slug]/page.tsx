import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DateChip, SeatMeter } from "@/components/events/event-card";
import { ShareButton } from "@/components/events/share-button";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/motion";
import { PartnerLogo, StateBadge } from "@/components/ui/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDate, formatDeadline, formatTimeRange } from "@/lib/datetime";
import { CATEGORY_LABEL, type RegistrationState } from "@/lib/event-state";
import { getPublicEvent, parseAgenda } from "@/lib/services/events";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const event = await getPublicEvent((await params).slug);
  return { title: event?.title ?? "Event not found", description: event?.description.slice(0, 155) };
}

const CTA_DISABLED: Partial<Record<RegistrationState, string>> = {
  FULL: "Event Full",
  CLOSED: "Registration Closed",
  NOT_OPEN: "Registration opens soon",
  ENDED: "Event has ended",
  CANCELLED: "Event cancelled",
};

export default async function EventDetailPage({ params }: { params: Params }) {
  const event = await getPublicEvent((await params).slug);
  if (!event) notFound();

  const user = await getCurrentUser();
  const mine = user
    ? await prisma.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } }, select: { id: true, status: true } })
    : null;
  const registered = mine?.status === "REGISTERED";
  const agenda = parseAgenda(event.agenda);
  const paragraphs = event.description.split(/\n{2,}/);

  return (
    <article>
      {/* Photo header with the title set on it */}
      <header className="relative isolate overflow-hidden bg-forest-deep text-white">
        <CoverImage src={event.coverImage} alt="" seed={event.title} eager className="absolute inset-0 -z-10 size-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-black/30" aria-hidden="true" />
        <div className="mx-auto flex min-h-[24rem] max-w-6xl flex-col justify-between px-4 pb-10 pt-6 sm:min-h-[30rem] sm:px-6">
          <Link href="/events" className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-black/40">
            <Icon name="arrow" className="size-4 rotate-180" /> All events
          </Link>
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
              <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">{CATEGORY_LABEL[event.category]}</span>
              <span className="rounded-md bg-white px-2.5 py-1"><StateBadge state={event.state} /></span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.03] text-white sm:text-6xl">{event.title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.9375rem] text-white/90">
              <span className="inline-flex items-center gap-1.5"><Icon name="calendar" className="size-4" />{formatDate(event.date, { weekday: true })}</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="size-4" />{formatTimeRange(event.startTime, event.endTime)}</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="pin" className="size-4" />{event.location}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_22.5rem]">
        <div className="min-w-0">
          <p className="text-sm text-muted">Organised by <span className="font-semibold text-charcoal">{event.organizer}</span></p>
          <div className="mt-5 space-y-5 text-[1.0625rem] leading-[1.75] text-charcoal/90">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-xl leading-relaxed text-charcoal" : ""}>{p}</p>
            ))}
          </div>

          {agenda.length > 0 && (
            <Reveal as="section" className="mt-16" >
              <h2 id="agenda" className="text-2xl font-semibold sm:text-3xl">The plan for the day</h2>
              <ol className="mt-7 divide-y divide-line border-y border-line">
                {agenda.map((a, i) => (
                  <li key={i} className="grid grid-cols-[6.5rem_1fr] gap-4 py-4 sm:grid-cols-[8rem_1fr]">
                    <span className="font-display text-lg font-semibold text-forest">{a.time || "—"}</span>
                    <span>
                      <span className="block font-semibold">{a.title}</span>
                      {a.description && <span className="mt-0.5 block text-[0.9375rem] text-muted">{a.description}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          {event.volunteerRequirements && (
            <Reveal as="section" className="mt-16">
              <div className="rounded-2xl bg-mint p-7 sm:p-9">
                <h2 className="text-2xl font-semibold">Volunteers needed</h2>
                <p className="mt-3 text-[1.0625rem]">{event.volunteerRequirements}</p>
                <p className="mt-4 text-sm text-muted">Choose a volunteer role when you register and your hours will be recorded after check-in.</p>
              </div>
            </Reveal>
          )}

          {event.partners.length > 0 && (
            <Reveal as="section" className="mt-16">
              <h2 className="text-2xl font-semibold sm:text-3xl">Delivered with</h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {event.partners.map(({ partner }) => (
                  <li key={partner.id} className="flex items-center gap-3.5">
                    <PartnerLogo name={partner.name} logo={partner.logo} size="size-12 shrink-0" />
                    <span className="font-semibold leading-snug">{partner.name}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {event.sdgs.length > 0 && (
            <Reveal as="section" className="mt-16">
              <h2 className="text-2xl font-semibold sm:text-3xl">Goals this supports</h2>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {event.sdgs.map(({ sdg }) => (
                  <li key={sdg.id}>
                    <Link href={`/events?sdg=${sdg.number}&when=all`} className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${sdg.number === 17 ? "border-forest bg-forest text-white hover:bg-forest-dark" : "border-line-strong bg-white hover:border-forest/50 hover:text-forest"}`}>
                      <span className="font-display font-semibold">{sdg.number}</span>{sdg.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Event details and registration">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_20px_40px_-28px_rgb(29_42_35/0.4)]">
            <div className="flex items-start gap-4">
              <DateChip date={event.date} className="border border-line shadow-none" />
              <div>
                <p className="font-display text-xl font-semibold leading-tight">{formatDate(event.date, { weekday: true })}</p>
                <p className="text-sm text-muted">{formatTimeRange(event.startTime, event.endTime)}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4 border-t border-line pt-5 text-[0.9375rem]">
              <div>
                <dt className="sr-only">Location</dt>
                <dd className="flex gap-3">
                  <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-forest" />
                  <span><span className="font-semibold">{event.location}</span>{event.address && <span className="block text-muted">{event.address}</span>}</span>
                </dd>
              </div>
              {event.registrationDeadline && (
                <div>
                  <dt className="sr-only">Registration deadline</dt>
                  <dd className="flex gap-3">
                    <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-forest" />
                    <span>Register by <span className="font-semibold">{formatDeadline(event.registrationDeadline)}</span></span>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 border-t border-line pt-5">
              <SeatMeter event={event} />
            </div>

            <div className="mt-6">
              {registered ? (
                <Link href={`/portal/tickets/${mine!.id}`} className="btn-primary btn-lg w-full">
                  <Icon name="ticket" /> View My Ticket
                </Link>
              ) : event.state === "OPEN" ? (
                <Link href={`/events/${event.slug}/register`} className="btn-primary btn-lg w-full">
                  Register for Event
                </Link>
              ) : (
                <button className="btn-secondary btn-lg w-full" disabled>
                  {CTA_DISABLED[event.state]}
                </button>
              )}
              {!user && event.state === "OPEN" && <p className="hint text-center">Free. You&apos;ll be asked to log in or create an account.</p>}
            </div>

            {event.state !== "CANCELLED" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`/events/${event.slug}/calendar`} className="btn-secondary btn-sm">
                  <Icon name="calendar" className="size-4" /> Add to calendar
                </a>
                <ShareButton title={event.title} />
              </div>
            )}
          </div>

          {(event.contactEmail || event.contactPhone) && (
            <div className="mt-4 px-1 text-sm">
              <p className="font-semibold">Questions about this event?</p>
              {event.contactEmail && <a className="-my-1 block py-2 text-forest hover:underline" href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>}
              {event.contactPhone && <p className="text-muted">{event.contactPhone}</p>}
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
