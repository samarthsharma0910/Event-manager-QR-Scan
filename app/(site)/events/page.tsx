import type { Metadata } from "next";
import { Suspense } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/server";
import { CATEGORY_LABEL } from "@/lib/event-state";
import { listPublicEvents } from "@/lib/services/events";
import { getSdgOptions } from "@/lib/services/public";

export const metadata: Metadata = { title: "Events" };

type SP = Promise<{ q?: string; category?: string; sdg?: string; when?: string }>;

export default async function EventsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const when = sp.when === "past" || sp.when === "all" ? sp.when : "upcoming";
  const [events, sdgs] = await Promise.all([
    listPublicEvents({ q: sp.q?.trim().slice(0, 80), category: sp.category, sdg: sp.sdg, when }),
    getSdgOptions(),
  ]);
  const filtered = !!(sp.q || sp.category || sp.sdg || when !== "upcoming");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] sm:text-6xl">Find your next way to help</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">Every event is free to join. Reserve a place and your QR ticket appears in your portal straight away.</p>

      <div className="mt-10">
        <Suspense fallback={<div className="skeleton h-12 w-full" />}>
          <EventFilters
            categories={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
            sdgs={sdgs.map((g) => ({ value: String(g.number), label: `SDG ${g.number} — ${g.title}` }))}
          />
        </Suspense>
      </div>

      <p className="mt-10 text-sm font-medium text-muted" role="status" aria-live="polite">
        {events.length} {events.length === 1 ? "event" : "events"}
        {filtered && " match your filters"}
      </p>

      <div className="mt-5">
        {events.length ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <Reveal key={e.id} delay={(i % 3) * 80}>
                <EventCard event={e} priority={i < 3} headingLevel={2} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState icon="calendar" title={filtered ? "No events match your search" : "No upcoming events"} action={filtered ? { href: "/events", label: "Clear filters" } : undefined}>
            {filtered ? "Try a different cause or search term, or look at past events." : "There aren't any events open for registration right now. Check back soon."}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
