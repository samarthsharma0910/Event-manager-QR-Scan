import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatTime } from "@/lib/datetime";
import { qrDataUrl } from "@/lib/qr";
import { getOwnTicket } from "@/lib/services/registrations";

export const metadata: Metadata = { title: "You're registered" };

export default async function RegisteredPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/portal/registered/${id}`);
  const reg = await getOwnTicket(user.id, id);
  if (!reg) notFound();
  const qr = await qrDataUrl(reg.ticketToken, 240);
  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="text-center">
        <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-forest text-white animate-pop">
          <span className="absolute inset-0 animate-ping rounded-full bg-forest/25 [animation-iteration-count:2]" aria-hidden="true" />
          <svg viewBox="0 0 24 24" className="relative size-10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="check-draw" d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1 className="mt-7 animate-rise text-4xl font-semibold leading-[1.05] sm:text-5xl">You&apos;re registered!</h1>
        <p className="mt-3 animate-rise text-lg text-muted [animation-delay:80ms]">Your place has been reserved and your event ticket is ready.</p>
      </div>

      <div className="mt-10 flex animate-rise items-center gap-5 overflow-hidden rounded-2xl border border-line bg-white p-5 [animation-delay:160ms]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="" className="size-24 shrink-0 rounded-lg border border-line p-1" />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-snug">{reg.event.title}</p>
          <p className="mt-1 text-sm text-muted">{formatDate(reg.event.date)} · {formatTime(reg.event.startTime)}</p>
          <p className="text-sm text-muted">{reg.event.location}</p>
          <p className="mt-2 text-sm text-muted">Registration ID <span className="font-mono font-semibold text-charcoal">{reg.registrationNumber}</span></p>
        </div>
      </div>

      <div className="mt-8 flex animate-rise flex-col justify-center gap-3 sm:flex-row [animation-delay:220ms]">
        <Link href={`/portal/tickets/${reg.id}`} className="btn-primary btn-lg"><Icon name="ticket" /> View My Ticket</Link>
        <Link href="/portal" className="btn-secondary btn-lg">Go to My Portal</Link>
        <a href={`/events/${reg.event.slug}/calendar`} className="btn-ghost btn-lg"><Icon name="calendar" /> Add to calendar</a>
      </div>
    </div>
  );
}
