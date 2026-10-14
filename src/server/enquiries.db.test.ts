import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createEnquiry } from "@/server/enquiries";
import { createTestClient, resetDatabase } from "@/test/db";

const db = createTestClient();
const NOW = new Date("2026-10-15T03:00:00Z");

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

const valid = {
  kind: "TOUR",
  topic: "the-coco-loop",
  name: "Sam Rider",
  email: " Sam@Example.com ",
  phone: "",
  message: "Two of us, early December, about 8 days. Is that possible?",
  preferredStart: "2026-12-03",
  riders: "2",
  website: "",
};

describe("createEnquiry", () => {
  it("saves an enquiry from a form, tidying the email and empty fields", async () => {
    expect((await createEnquiry(db, valid, NOW)).ok).toBe(true);
    const saved = await db.enquiry.findFirstOrThrow();
    expect(saved).toMatchObject({
      kind: "TOUR",
      topic: "the-coco-loop",
      email: "sam@example.com",
      phone: null,
      riders: 2,
      handledAt: null,
    });
    expect(saved.preferredStart?.toISOString().slice(0, 10)).toBe("2026-12-03");
  });

  it("says which field is wrong", async () => {
    expect(await createEnquiry(db, { ...valid, email: "not-an-email" }, NOW)).toMatchObject({
      ok: false,
      field: "email",
    });
    expect(await createEnquiry(db, { ...valid, message: "hi" }, NOW)).toMatchObject({
      ok: false,
      field: "message",
    });
  });

  it("quietly drops spam that fills in the hidden field", async () => {
    expect(await createEnquiry(db, { ...valid, website: "http://spam.example" }, NOW)).toEqual({
      ok: true,
    });
    expect(await db.enquiry.count()).toBe(0);
  });

  it("accepts at most 5 enquiries an hour from one email", async () => {
    for (let i = 0; i < 5; i++) expect((await createEnquiry(db, valid, NOW)).ok).toBe(true);
    expect((await createEnquiry(db, valid, NOW)).ok).toBe(false);
    expect((await createEnquiry(db, valid, new Date(NOW.getTime() + 61 * 60_000))).ok).toBe(true);
  });
});
