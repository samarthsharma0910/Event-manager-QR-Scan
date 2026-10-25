import type { Metadata } from "next";
import { Icon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/motion";
import { EmptyState, PartnerLogo } from "@/components/ui/server";
import { PARTNER_TYPE_LABEL } from "@/lib/event-state";
import { getPublicPartners } from "@/lib/services/public";

export const metadata: Metadata = { title: "Partners" };

export default async function PartnersPage() {
  const partners = await getPublicPartners();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <p className="eyebrow">SDG 17 · Partnerships for the Goals</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">Our partners</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">Community change works when institutions, businesses and neighbours pull in the same direction.</p>
      {partners.length ? (
        <ul className="mt-14 grid gap-x-12 gap-y-0 sm:grid-cols-2">
          {partners.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 2) * 80} className="flex gap-5 border-t border-line py-8">
              <PartnerLogo name={p.name} logo={p.logo} size="size-16 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-xl font-semibold leading-snug">{p.name}</h2>
                <p className="mt-0.5 text-sm font-medium text-forest">{PARTNER_TYPE_LABEL[p.type]}</p>
                {p.description && <p className="mt-2.5 text-muted">{p.description}</p>}
                <p className="mt-3 flex flex-wrap items-center gap-x-4 text-sm text-muted">
                  <span>{p._count.events} {p._count.events === 1 ? "event" : "events"} together</span>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="-my-2 inline-flex min-h-10 items-center gap-1 font-semibold text-forest hover:underline">
                      Website <Icon name="external" className="size-3.5" />
                    </a>
                  )}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState icon="handshake" title="Partners coming soon">We&apos;re growing our network of partners.</EmptyState>
        </div>
      )}
    </div>
  );
}
