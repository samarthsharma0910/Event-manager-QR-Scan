import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadTicketButton } from "@/components/tickets/download-button";
import { Ticket } from "@/components/tickets/ticket";
import { ConfirmButton } from "@/components/ui/client";
import { cancelRegistrationAction } from "@/app/actions/participant";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatTime } from "@/lib/datetime";
import { qrDataUrl } from "@/lib/qr";
import { getOwnTicket } from "@/lib/services/registrations";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "My ticket" };

/** Event-day screen: big QR, minimal chrome. */
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/portal/tickets/${id}`);
  const reg = await getOwnTicket(user.id, id);
  if (!reg) notFound();
  const [settings, qr] = await Promise.all([getSettings(), qrDataUrl(reg.ticketToken)]);

  const state = reg.status === "CANCELLED" ? "CANCELLED" : reg.event.status === "CANCELLED" ? "EVENT_CANCELLED" : reg.attendance ? "CHECKED_IN" : "REGISTERED";
  const canCancel = state === "REGISTERED" && reg.event.status !== "COMPLETED";

  return (
    <div className="min-h-dvh bg-mint px-4 pb-10 pt-4">
      <div className="mx-auto max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/portal/tickets" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">
            ← My tickets
          </Link>
          <Link href={`/events/${reg.event.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">
            Event details
          </Link>
        </div>

        <Ticket
          t={{
            orgName: settings.name,
            eventTitle: reg.event.title,
            participant: reg.fullName,
            date: reg.event.date,
            startTime: reg.event.startTime,
            location: reg.event.location,
            address: reg.event.address,
            latitude: reg.event.latitude,
            longitude: reg.event.longitude,
            registrationNumber: reg.registrationNumber,
            qr,
            state,
            checkedInAt: reg.attendance?.checkedInAt,
            cover: reg.event.coverImage,
          }}
        />

        {state !== "CANCELLED" && state !== "EVENT_CANCELLED" && (
          <div className="mt-4 space-y-3">
            <DownloadTicketButton
              qr={qr}
              orgName={settings.name}
              eventTitle={reg.event.title}
              participant={reg.fullName}
              when={`${formatDate(reg.event.date)} · ${formatTime(reg.event.startTime)}`}
              location={reg.event.location}
              address={reg.event.address ?? undefined}
              registrationNumber={reg.registrationNumber}
            />
            {canCancel && (
              <div className="text-center">
                <ConfirmButton
                  action={cancelRegistrationAction}
                  fields={{ registrationId: reg.id }}
                  label="Can't make it? Cancel registration"
                  title="Cancel your registration?"
                  message="Your ticket will stop working and your seat will be released for someone else."
                  confirmLabel="Yes, cancel"
                  triggerClass="text-sm font-semibold text-danger hover:underline min-h-11 px-3"
                  danger
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
