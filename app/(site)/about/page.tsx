import type { Metadata } from "next";
import Link from "next/link";
import { CoverImage } from "@/components/ui/client";
import { Icon } from "@/components/ui/icons";
import { CountUp, Reveal } from "@/components/ui/motion";
import { getSettings } from "@/lib/services/settings";
import { getImpactStats } from "@/lib/services/stats";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const [s, impact] = await Promise.all([getSettings(), getImpactStats()]);
  const numbers = [
    { v: impact.participants, l: "people have joined an event" },
    { v: impact.volunteers, l: "have volunteered their time" },
    { v: impact.communityHours, l: "hours given to communities" },
  ];
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div className="animate-rise">
          <p className="eyebrow">About {s.shortName}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] sm:text-6xl">{s.name}</h1>
          <p className="mt-6 text-xl leading-relaxed text-charcoal/85">{s.tagline}</p>
          <div className="mt-8 space-y-4 text-[1.0625rem] leading-[1.75] text-muted">
            {s.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/events" className="btn-primary btn-lg">Explore events <Icon name="arrow" className="size-4" /></Link>
            <Link href="/partners" className="btn-secondary btn-lg">Our partners</Link>
          </div>
        </div>
        <div className="animate-rise overflow-hidden rounded-[2rem] [animation-delay:100ms]">
          <CoverImage src="/photos/cleanup.jpg" alt="Volunteers collecting litter on a beach" eager className="aspect-[4/5] w-full" />
        </div>
      </section>

      <section className="border-y border-line bg-paper" aria-label="Our numbers">
        <dl className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {numbers.map((n, i) => (
            <Reveal key={n.l} delay={i * 90}>
              <dd className="font-display text-5xl font-semibold text-forest-deep"><CountUp value={n.v} /></dd>
              <dt className="mt-1 text-muted">{n.l}</dt>
            </Reveal>
          ))}
        </dl>
      </section>

      {(s.contactEmail || s.address || s.contactPhone) && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">Get in touch</h2>
          <dl className="mt-6 grid gap-8 text-[0.9375rem] sm:grid-cols-3">
            {s.address && <div><dt className="font-semibold">Visit</dt><dd className="mt-1 text-muted">{s.address}</dd></div>}
            {s.contactEmail && <div><dt className="font-semibold">Email</dt><dd className="mt-1"><a className="text-forest hover:underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></dd></div>}
            {s.contactPhone && <div><dt className="font-semibold">Call</dt><dd className="mt-1 text-muted">{s.contactPhone}</dd></div>}
          </dl>
        </section>
      )}
    </div>
  );
}
