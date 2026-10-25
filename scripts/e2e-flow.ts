/**
 * End-to-end test of the money path against the real PostgreSQL database:
 * capacity/race handling on registration, and every QR check-in outcome.
 * Creates throw-away data and removes it afterwards.   Run: npm run test:flow
 */
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db";
import { registerForEvent, cancelRegistration } from "../lib/services/registrations";
import { performCheckIn } from "../lib/services/checkin";

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  console.log(`${cond ? "  ✓" : "  ✗ FAIL"} ${name}${cond || extra === undefined ? "" : ` → ${JSON.stringify(extra)}`}`);
  if (!cond) failures++;
}

async function main() {
  const run = randomUUID().slice(0, 8);
  const created = { users: [] as string[], events: [] as string[] };
  const mkUser = async (role: "PARTICIPANT" | "CHECKIN_STAFF", i: number) => {
    const u = await prisma.user.create({ data: { name: `Test ${role} ${i}`, email: `e2e-${run}-${role}-${i}@example.com`, passwordHash: "x", role } });
    created.users.push(u.id);
    return u;
  };
  const mkEvent = async (title: string, capacity: number) => {
    const e = await prisma.event.create({
      data: {
        title, slug: `e2e-${run}-${title.toLowerCase().replace(/\W+/g, "-")}`, description: "E2E test event for the check-in flow.", date: new Date("2027-03-01T00:00:00Z"),
        startTime: "09:00", endTime: "12:00", location: "Test park", capacity, status: "REGISTRATION_OPEN", organizer: "Test",
      },
    });
    created.events.push(e.id);
    return e;
  };
  const input = (n: number) => ({ fullName: `Person ${n}`, email: `p${n}@example.com`, phone: "+91 98765 43210", volunteerInterest: "ATTENDEE_ONLY" });

  try {
    console.log("\nRegistration & capacity");
    const eventA = await mkEvent("Event A", 3);
    const eventB = await mkEvent("Event B", 10);
    const staff = await mkUser("CHECKIN_STAFF", 0);
    const people = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => mkUser("PARTICIPANT", i)));

    // Six people race for three seats.
    const results = await Promise.all(people.map((p, i) => registerForEvent(p.id, eventA.id, input(i))));
    const ok = results.filter((r) => r.ok);
    const full = results.filter((r) => !r.ok && r.code === "FULL");
    check("exactly 3 of 6 concurrent registrations succeed", ok.length === 3, results.map((r) => (r.ok ? "ok" : r.code)));
    check("the other 3 are rejected as FULL", full.length === 3);
    const afterA = await prisma.event.findUniqueOrThrow({ where: { id: eventA.id } });
    check("event status flipped to FULL automatically", afterA.status === "FULL", afterA.status);
    check("registration count in DB equals capacity", (await prisma.registration.count({ where: { eventId: eventA.id, status: "REGISTERED" } })) === 3);

    const winner = people[results.findIndex((r) => r.ok)];
    const dup = await registerForEvent(winner.id, eventA.id, input(1));
    check("duplicate registration is blocked", !dup.ok && dup.code === "ALREADY_REGISTERED");

    const regs = await prisma.registration.findMany({ where: { eventId: eventA.id, status: "REGISTERED" }, orderBy: { seq: "asc" } });
    check("tickets are unique, prefixed, non-personal tokens", new Set(regs.map((r) => r.ticketToken)).size === 3 && regs.every((r) => /^GBF-TKT-[0-9a-f]{48}$/.test(r.ticketToken)), regs[0].ticketToken);
    check("registration numbers follow GBF-YYYY-NNNNN", regs.every((r) => /^GBF-2027-\d{5}$/.test(r.registrationNumber)), regs.map((r) => r.registrationNumber));

    console.log("\nCheck-in outcomes");
    const actor = { id: staff.id, role: staff.role };
    const [r1, r2, r3] = regs;

    const s1 = await performCheckIn({ actor, eventId: eventA.id, code: r1.ticketToken, method: "QR_SCAN" });
    check("valid QR → SUCCESS", s1.status === "SUCCESS", s1);
    const attRow = await prisma.attendance.findUnique({ where: { registrationId: r1.id } });
    check("attendance row saved with checkedInBy + method", attRow?.checkedInById === staff.id && attRow?.method === "QR_SCAN");

    const again = await performCheckIn({ actor, eventId: eventA.id, code: r1.ticketToken, method: "QR_SCAN" });
    check("second scan → ALREADY_CHECKED_IN", again.status === "ALREADY_CHECKED_IN", again);
    check("no duplicate attendance created", (await prisma.attendance.count({ where: { registrationId: r1.id } })) === 1);

    const invalid = await performCheckIn({ actor, eventId: eventA.id, code: "GBF-TKT-" + "0".repeat(48), method: "QR_SCAN" });
    check("unknown token → INVALID", invalid.status === "INVALID");
    const byNumberOnQr = await performCheckIn({ actor, eventId: eventA.id, code: r2.registrationNumber, method: "QR_SCAN" });
    check("registration number is NOT accepted as a QR payload", byNumberOnQr.status === "INVALID");

    const regB = await registerForEvent(people[0].id, eventB.id, input(9));
    const tokenB = regB.ok ? (await prisma.registration.findUniqueOrThrow({ where: { id: regB.registrationId } })).ticketToken : "";
    const wrong = await performCheckIn({ actor, eventId: eventA.id, code: tokenB, method: "QR_SCAN" });
    check("ticket for another event → WRONG_EVENT", wrong.status === "WRONG_EVENT" && wrong.ticketEvent === "Event B" && wrong.currentEvent === "Event A", wrong);
    check("wrong-event scan created no attendance", (await prisma.attendance.count({ where: { eventId: eventB.id } })) === 0);

    const denied = await performCheckIn({ actor: { id: people[0].id, role: "PARTICIPANT" }, eventId: eventA.id, code: r2.ticketToken, method: "QR_SCAN" });
    check("participant role cannot check anyone in", denied.status === "FORBIDDEN");

    // Two scanners hit the same ticket at the same instant.
    const [x, y] = await Promise.all([
      performCheckIn({ actor, eventId: eventA.id, code: r2.ticketToken, method: "QR_SCAN" }),
      performCheckIn({ actor, eventId: eventA.id, code: r2.ticketToken, method: "QR_SCAN" }),
    ]);
    check("simultaneous scans: exactly one SUCCESS", [x, y].filter((r) => r.status === "SUCCESS").length === 1 && [x, y].filter((r) => r.status === "ALREADY_CHECKED_IN").length === 1, [x.status, y.status]);
    check("simultaneous scans: one attendance row", (await prisma.attendance.count({ where: { registrationId: r2.id } })) === 1);

    const manual = await performCheckIn({ actor, eventId: eventA.id, code: r3.registrationNumber.toLowerCase(), method: "MANUAL_ID" });
    check("manual registration-number entry → SUCCESS (same checks)", manual.status === "SUCCESS", manual);

    console.log("\nCancellation & capacity release");
    const cancelled = await cancelRegistration(regs[2].id, {});
    check("cannot cancel after check-in", !cancelled.ok && cancelled.code === "ATTENDED");
    const bReg = regB.ok ? regB.registrationId : "";
    check("participant can cancel their own registration", (await cancelRegistration(bReg, { userId: people[0].id })).ok);
    const afterCancel = await performCheckIn({ actor, eventId: eventB.id, code: tokenB, method: "QR_SCAN" });
    check("cancelled ticket → CANCELLED_TICKET", afterCancel.status === "CANCELLED_TICKET", afterCancel);

    await prisma.event.update({ where: { id: eventB.id }, data: { status: "COMPLETED" } });
    const other = await registerForEvent(people[1].id, eventB.id, input(8));
    check("completed events reject registration", !other.ok);

    const attended = await prisma.attendance.count({ where: { eventId: eventA.id } });
    const registered = await prisma.registration.count({ where: { eventId: eventA.id, status: "REGISTERED" } });
    check(`stats derive from DB: ${attended}/${registered} attended`, attended === 3 && registered === 3);
  } finally {
    await prisma.attendance.deleteMany({ where: { eventId: { in: created.events } } });
    await prisma.registration.deleteMany({ where: { eventId: { in: created.events } } });
    await prisma.event.deleteMany({ where: { id: { in: created.events } } });
    await prisma.user.deleteMany({ where: { id: { in: created.users } } });
    await prisma.$disconnect();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
