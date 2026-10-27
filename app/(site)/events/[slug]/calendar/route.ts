import { getPublicEvent } from "@/lib/services/events";
import { eventEnd, eventStart } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
/** Floating local time (no timezone): the calendar app shows the event at the same wall-clock time as the venue. */
const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** "Add to calendar": a standard .ics file any calendar app can import. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await getPublicEvent((await params).slug);
  if (!event || event.state === "CANCELLED") return new Response("Not found", { status: 404 });
  const origin = new URL(req.url).origin;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event platform//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@events`,
    `DTSTAMP:${stamp(new Date())}Z`.replace("Z", "Z"),
    `DTSTART:${stamp(eventStart(event))}`,
    `DTEND:${stamp(eventEnd(event))}`,
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc(event.description.split("\n")[0] + `\n\n${origin}/events/${event.slug}`)}`,
    `LOCATION:${esc([event.location, event.address].filter(Boolean).join(", "))}`,
    ...(event.latitude != null && event.longitude != null ? [`GEO:${event.latitude};${event.longitude}`] : []),
    `URL:${origin}/events/${event.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
