import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Email } from "@/server/email";
import { checkOut } from "@/server/booking-admin";
import { reserveBike } from "@/server/bookings";
import { sendMorningList } from "@/server/morning";
import { markOilReminderSent, oilDueToday, oilList, recordKm, recordOilChange } from "@/server/oil";
import { createTestClient, day, resetDatabase } from "@/test/db";
import { onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
  process.env.BOOKINGS_EMAIL = "shop@example.com";
});
afterAll(() => db.$disconnect());

/** 09:00 in Saigon on a given day. */
const at9 = (iso: string) => new Date(`${iso}T02:00:00Z`);

/** A CB150X out with a customer from 10 to 30 Nov. */
async function onTheRoad(phone = "+44 7700 900123") {
  const result = await reserveBike(
    db,
    onlineBooking(fleet.cb150x.id, {
      customer: { name: "Sam Rider", email: "sam@example.com", phone },
      startDate: "2026-11-10",
      endDate: "2026-11-30",
    }),
  );
  if (!result.ok) throw new Error(JSON.stringify(result));
  await db.booking.update({ where: { id: result.booking.id }, data: { status: "CONFIRMED" } });
  await checkOut(db, result.booking.id);
  return result.booking.id;
}

describe("oil reminders", () => {
  it("is due 5 days after pick-up, then 2 days after each reminder", async () => {
    const id = await onTheRoad();
    expect(await oilDueToday(db, at9("2026-11-14"))).toHaveLength(0);
    expect(await oilDueToday(db, at9("2026-11-15"))).toHaveLength(1);

    const link = await markOilReminderSent(db, id, at9("2026-11-15"));
    expect(link).toMatch(/^https:\/\/wa\.me\/447700900123\?text=Hi%20Sam!/);
    expect(await oilDueToday(db, at9("2026-11-16"))).toHaveLength(0);
    expect(await oilDueToday(db, at9("2026-11-17"))).toHaveLength(1);
  });

  it("starts again 5 days after the oil change and clears the km", async () => {
    const id = await onTheRoad();
    await recordKm(db, id, { km: "700" }, at9("2026-11-15"));
    expect(await recordOilChange(db, id, { changedOn: "2026-11-16" }, at9("2026-11-17"))).toEqual({
      ok: true,
    });
    expect(await oilDueToday(db, at9("2026-11-20"))).toHaveLength(0);
    expect(await oilDueToday(db, at9("2026-11-21"))).toHaveLength(1);
    const [row] = await oilList(db, at9("2026-11-17"));
    expect(row.kmSinceOilChange).toBeNull();
  });

  it("takes today when the oil change date is left empty", async () => {
    const id = await onTheRoad();
    await recordOilChange(db, id, { changedOn: "" }, at9("2026-11-18"));
    const [row] = await oilList(db, at9("2026-11-18"));
    expect(row.oilChangedOn?.toISOString().slice(0, 10)).toBe("2026-11-18");
    expect(row.next.toISOString().slice(0, 10)).toBe("2026-11-23");
  });

  it("puts a due reminder off by 2 days when the customer reports their km", async () => {
    const id = await onTheRoad();
    expect(await oilDueToday(db, at9("2026-11-16"))).toHaveLength(1);
    expect(await recordKm(db, id, { km: "500" }, at9("2026-11-16"))).toEqual({ ok: true });
    expect(await oilDueToday(db, at9("2026-11-16"))).toHaveLength(0);
    expect(await oilDueToday(db, at9("2026-11-17"))).toHaveLength(0);
    expect(await oilDueToday(db, at9("2026-11-18"))).toHaveLength(1);
  });

  it("uses the model's km rule (2,500 km on the CB150X)", async () => {
    const id = await onTheRoad();
    await recordKm(db, id, { km: "2,400" }, at9("2026-11-12"));
    let [row] = await oilList(db, at9("2026-11-12"));
    expect(row).toMatchObject({ kmSinceOilChange: 2400, overKm: false });
    await recordKm(db, id, { km: "2600" }, at9("2026-11-13"));
    [row] = await oilList(db, at9("2026-11-13"));
    expect(row.overKm).toBe(true);
  });

  it("refuses an oil change in the future or a strange km", async () => {
    const id = await onTheRoad();
    const now = at9("2026-11-12");
    expect(await recordOilChange(db, id, { changedOn: "2026-11-13" }, now)).toMatchObject({
      ok: false,
    });
    expect(await recordKm(db, id, { km: "lots" }, now)).toMatchObject({ ok: false });
    expect(await recordKm(db, id, { km: "" }, now)).toMatchObject({ ok: false });
  });

  it("needs no reminder for a bike coming back by tomorrow", async () => {
    await onTheRoad();
    const [row] = await oilList(db, at9("2026-11-29"));
    expect(row).toMatchObject({ due: true, endingSoon: true });
    expect(await oilDueToday(db, at9("2026-11-29"))).toHaveLength(0);
  });

  it("gives no WhatsApp link without a usable number", async () => {
    const id = await onTheRoad("12");
    expect(await markOilReminderSent(db, id, at9("2026-11-15"))).toBeNull();
  });
});

describe("morning list email", () => {
  function outbox() {
    const sent: Email[] = [];
    return { sent, send: async (email: Email) => void sent.push(email) };
  }

  it("is sent once a day from 08:00, with the oil reminders due", async () => {
    await onTheRoad();
    const box = outbox();
    const now = at9("2026-11-15");
    expect(await sendMorningList(db, now, 7, box.send)).toBe(false);
    expect(await sendMorningList(db, now, 9, box.send)).toBe(true);
    expect(await sendMorningList(db, now, 10, box.send)).toBe(false);
    expect(box.sent).toHaveLength(1);
    expect(box.sent[0].to).toBe("shop@example.com");
    expect(box.sent[0].subject).toBe("Today at the shop: 1 oil");
    expect(box.sent[0].text).toContain("Sam Rider · Honda CB150X");
    // Phone numbers stay in the staff area.
    expect(box.sent[0].text).not.toContain("7700");
  });

  it("sends nothing on a quiet day, and retries after a failed send", async () => {
    const box = outbox();
    expect(await sendMorningList(db, at9("2026-11-15"), 9, box.send)).toBe(false);
    expect(box.sent).toHaveLength(0);

    await onTheRoad();
    const failing = async () => {
      throw new Error("Resend is down");
    };
    expect(await sendMorningList(db, at9("2026-11-16"), 9, failing)).toBe(false);
    expect(await db.dailyEmail.count({ where: { day: day("2026-11-16") } })).toBe(0);
    expect(await sendMorningList(db, at9("2026-11-16"), 10, box.send)).toBe(true);
  });
});
