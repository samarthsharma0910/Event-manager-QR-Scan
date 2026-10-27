import type { Metadata } from "next";
import Link from "next/link";
import { DateChip } from "@/components/events/event-card";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/motion";
import { EmptyState, Notice, flashParams } from "@/components/ui/server";
import { requireUser } from "@/lib/auth/session";
import { formatTime } from "@/lib/datetime";
import { qrDataUrl } from "@/lib/qr";
import { getUserRegistrations } from "@/lib/services/registrations";

export const metadata: Metadata = { title: "My tickets" };

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser("/portal/tickets");
  const flash = flashParams(await searchParams);
  const regs = await getUserRegistrations(user.id);
  const withQr = await Promise.all(regs.map(async (r) => ({ r, qr: await qrDataUrl(r.ticketToken, 200) })));

  return (
    <div>
      <Notice {...flash} />
      <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl">My tickets</h1>
      <p className="mt-3 text-lg text-muted">Open a ticket on event day and show the QR code at check-in.</p>
      <div className="mt-10">
        {withQr.length ? (
          <ul className="grid gap-6 md:grid-cols-2">
            {withQr.map(({ r, qr }, i) => {
              const state = r.event.status === "CANCELLED" ? "Event cancelled" : r.attendance ? "Checked in" : "Registered";
              return (
                <Reveal as="li" key={r.id} delay={i * 70}>
                  <Link
                    href={`/portal/tickets/${r.id}`}
                    className="lift group relative flex overflow-hidden rounded-2xl border border-line bg-white"
                  >
                    <div className="relative hidden w-32 shrink-0 sm:block">
                      <CoverImage src={r.event.coverImage} alt="" seed={r.event.title} className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-2 top-2"><DateChip date={r.event.date} /></span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-semibold ${state === "Registered" ? "text-forest" : state === "Checked in" ? "text-forest" : "text-danger"}`}>
                        <i aria-hidden="true" className={`size-2 rounded-full ${state === "Event cancelled" ? "bg-danger" : "bg-forest"}`} />
                        {state}
                      </span>
                      <h2 className="mt-1.5 text-xl font-semibold leading-snug">{r.event.title}</h2>
                      <p className="mt-1 text-sm text-muted">{formatTime(r.event.startTime)} · {r.event.location}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest">
                        Open Ticket <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center border-l-2 border-dashed border-line-strong px-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr} alt={`QR thumbnail for ${r.event.title}`} className="size-20 rounded-md" />
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon="ticket" title="Your tickets will appear here" action={{ href: "/events", label: "Explore events" }}>
            Register for an event to receive your digital ticket.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
