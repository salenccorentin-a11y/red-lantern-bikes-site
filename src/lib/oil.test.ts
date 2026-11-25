import { describe, expect, it } from "vitest";
import {
  daysSinceOilChange,
  nextOilReminder,
  oilReminderDue,
  oilReminderLink,
  whatsappDigits,
} from "@/lib/oil";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

describe("nextOilReminder", () => {
  it("is 5 days after pick-up when there's been no oil change", () => {
    const s = { startDate: d("2026-11-10"), oilChangedOn: null, oilReminderSentOn: null };
    expect(iso(nextOilReminder(s))).toBe("2026-11-15");
  });

  it("is 5 days after the last oil change", () => {
    const s = {
      startDate: d("2026-11-10"),
      oilChangedOn: d("2026-11-14"),
      oilReminderSentOn: null,
    };
    expect(iso(nextOilReminder(s))).toBe("2026-11-19");
  });

  it("repeats every 2 days after a reminder", () => {
    const s = {
      startDate: d("2026-11-10"),
      oilChangedOn: null,
      oilReminderSentOn: d("2026-11-16"),
    };
    expect(iso(nextOilReminder(s))).toBe("2026-11-18");
  });

  it("ignores a reminder sent before the last oil change", () => {
    const s = {
      startDate: d("2026-11-01"),
      oilChangedOn: d("2026-11-08"),
      oilReminderSentOn: d("2026-11-06"),
    };
    expect(iso(nextOilReminder(s))).toBe("2026-11-13");
  });
});

describe("oilReminderDue and daysSinceOilChange", () => {
  const s = { startDate: d("2026-11-10"), oilChangedOn: null, oilReminderSentOn: null };
  it("is due on the day and after, not before", () => {
    expect(oilReminderDue(s, d("2026-11-14"))).toBe(false);
    expect(oilReminderDue(s, d("2026-11-15"))).toBe(true);
    expect(oilReminderDue(s, d("2026-11-20"))).toBe(true);
  });
  it("counts days since pick-up", () => {
    expect(daysSinceOilChange(s, d("2026-11-15"))).toBe(5);
  });
});

describe("WhatsApp links", () => {
  it("keeps digits only and drops a leading 00", () => {
    expect(whatsappDigits("+44 7700 900123")).toBe("447700900123");
    expect(whatsappDigits("0049 151 1234567")).toBe("491511234567");
    expect(whatsappDigits("123")).toBeNull();
    expect(whatsappDigits(null)).toBeNull();
  });

  it("pre-fills the reminder with the first name", () => {
    const link = oilReminderLink("+33 6 12 34 56 78", "Markus Weber")!;
    expect(link.startsWith("https://wa.me/33612345678?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toMatch(/^Hi Markus! Hope the trip/);
  });
});
