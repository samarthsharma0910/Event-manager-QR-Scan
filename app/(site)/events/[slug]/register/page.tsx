import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DateChip, SeatMeter } from "@/components/events/event-card";
import { RegistrationForm } from "@/components/events/registration-form";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDate, formatTimeRange } from "@/lib/datetime";
import { REG_STATE_LABEL } from "@/lib/event-state";
import { getPublicEvent } from "@/lib/services/events";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/events/${slug}/register`);
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const mine = await prisma.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } });
  if (mine?.status === "REGISTERED") redirect(`/portal/tickets/${mine.id}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <Link href={`/events/${event.slug}`} className="-my-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
        <Icon name="arrow" className="size-4 rotate-180" /> Back to event
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_21rem]">
        <div className="animate-rise">
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl">Reserve your place</h1>
          <p className="mt-3 max-w-lg text-lg text-muted">It takes about a minute. Your QR ticket is created as soon as you submit.</p>

          <div className="mt-9">
            {event.state === "OPEN" ? (
              <RegistrationForm
                eventId={event.id}
                defaults={{
                  fullName: user.name,
                  email: user.email,
                  phone: user.phone ?? "",
                  organization: user.organization ?? "",
                  city: user.city ?? "",
                }}
              />
            ) : (
              <div role="alert" className="rounded-2xl border border-amber/30 bg-amber-soft p-6">
                <p className="font-display text-xl font-semibold text-amber">{REG_STATE_LABEL[event.state]}</p>
                <p className="mt-1 text-amber">
                  {event.state === "FULL"
                    ? "This event is full."
                    : event.state === "CLOSED"
                      ? "This event is no longer accepting registrations."
                      : "You can't register for this event right now."}
                </p>
                <Link href="/events" className="btn-secondary mt-4">Browse other events</Link>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Event summary">
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="relative aspect-[16/10]">
              <CoverImage src={event.coverImage} alt="" seed={event.title} className="size-full" />
              <span className="absolute left-3 top-3"><DateChip date={event.date} /></span>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold leading-snug">{event.title}</h2>
              <dl className="mt-3 space-y-2 text-sm text-muted">
                <div className="flex gap-2"><Icon name="calendar" className="mt-0.5 size-4 shrink-0 text-forest" /><dt className="sr-only">When</dt><dd>{formatDate(event.date)}, {formatTimeRange(event.startTime, event.endTime)}</dd></div>
                <div className="flex gap-2"><Icon name="pin" className="mt-0.5 size-4 shrink-0 text-forest" /><dt className="sr-only">Where</dt><dd>{event.location}</dd></div>
              </dl>
              <SeatMeter event={event} className="mt-4 border-t border-line pt-4" />
            </div>
          </div>
          <ul className="mt-5 space-y-2.5 px-1 text-sm text-muted">
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-forest" />Free to attend</li>
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-forest" />Your ticket lives in My Portal — nothing to print</li>
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-forest" />Can&apos;t make it? Cancel anytime and free the seat</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
