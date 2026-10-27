import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, contactLine } from "@/components/site/legal";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Privacy policy" intro={`${s.name} runs community events and volunteering. This page explains what personal information this website collects, why, and the choices you have.`}>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email address, phone number (optional) and a password, which we store only as a one-way hash.</li>
          <li><strong>Registration details:</strong> your organisation or institution, city and volunteer interest, for each event you register for.</li>
          <li><strong>Attendance records:</strong> whether you checked in, when, and which team member scanned your ticket.</li>
          <li><strong>Technical data:</strong> a single sign-in cookie, and your network address for security (rate limiting), not for tracking.</li>
        </ul>
        <p>Your QR ticket contains only a random code. It never contains your name, email or phone number.</p>
      </section>
      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To manage registrations, capacity and tickets for the events you sign up to.</li>
          <li>To record attendance and volunteer hours, and to produce summary reports for {s.shortName} and its partners. Reports are aggregated counts, not lists of names.</li>
          <li>To email you about your registration, account security and event changes.</li>
        </ul>
      </section>
      <section>
        <h2>Who sees it</h2>
        <p>Authorised {s.shortName} staff and check-in volunteers can see registrations for the events they work on. We do not sell your information or use it for advertising.</p>
        <p>We use service providers to run this site: our hosting provider and database provider store the data, and an email provider delivers messages. They process it only on our behalf.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>We use one strictly necessary cookie to keep you signed in. There are no advertising or analytics cookies, so there is no cookie banner to dismiss.</p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>We keep your account and registration history until you delete your account. After the end of an event we may keep anonymised totals (for example, how many people attended) indefinitely.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <ul>
          <li><strong>See and correct</strong> your details any time in <Link href="/portal/profile" className="font-semibold text-forest underline">your profile</Link>.</li>
          <li><strong>Delete your account</strong> yourself from the same page. This removes your profile, registrations and tickets, and releases your seats.</li>
          <li><strong>Ask us</strong> for a copy of your data or any other help: {contactLine(s)}.</li>
        </ul>
      </section>
      <section>
        <h2>Children</h2>
        <p>If you are under 18, please register with a parent or guardian&apos;s knowledge and permission.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>If we change this policy in a meaningful way we will update the date above and, where appropriate, tell registered participants.</p>
      </section>
    </LegalPage>
  );
}
