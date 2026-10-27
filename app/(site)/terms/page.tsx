import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, contactLine } from "@/components/site/legal";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Terms of use" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Terms of use" intro={`By creating an account or registering for an event run by ${s.name}, you agree to these terms. They are written to be read.`}>
      <section>
        <h2>Registering for events</h2>
        <ul>
          <li>Events are free to join unless the event page says otherwise. A registration reserves one place for you.</li>
          <li>Please give accurate details. We may cancel a registration that uses false information.</li>
          <li>Places are limited. If you can&apos;t come, please cancel from your ticket page so someone else can take your seat.</li>
        </ul>
      </section>
      <section>
        <h2>Your ticket</h2>
        <ul>
          <li>Your QR ticket is personal. Please don&apos;t share or post it: anyone holding it could use your place.</li>
          <li>A ticket can be checked in once. We may refuse entry if a ticket is invalid, cancelled, or for a different event.</li>
        </ul>
      </section>
      <section>
        <h2>On the day</h2>
        <ul>
          <li>Follow the instructions of organisers and volunteers, and look after yourself and others. Some activities involve outdoor work or physical effort, so only take part in what you are comfortable doing.</li>
          <li>We may ask anyone to leave who puts people at risk or behaves disrespectfully.</li>
          <li>Photographs may be taken at events to show our work. Tell a team member if you would rather not appear.</li>
        </ul>
      </section>
      <section>
        <h2>Changes and cancellations</h2>
        <p>We may change the time, place or programme of an event, or cancel it, for example because of weather or safety. We will update the event page and, where we can, email registered participants.</p>
      </section>
      <section>
        <h2>Volunteers</h2>
        <p>Volunteering is unpaid and voluntary. Volunteer hours are recorded from event check-in so that you can see your contribution.</p>
      </section>
      <section>
        <h2>Responsibility</h2>
        <p>We take care to run safe, well-organised events, but you take part at your own risk to the extent the law allows. Nothing in these terms limits any right you have that cannot legally be limited.</p>
      </section>
      <section>
        <h2>Your data</h2>
        <p>How we handle personal information is explained in our <Link href="/privacy" className="font-semibold text-forest underline">privacy policy</Link>.</p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>Contact {contactLine(s)}.</p>
      </section>
    </LegalPage>
  );
}
