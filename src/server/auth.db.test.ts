import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  consumeLoginToken,
  createLoginToken,
  endSession,
  findSessionStaff,
  hashToken,
  peekLoginToken,
} from "@/server/auth";
import { createTestClient, resetDatabase } from "@/test/db";

const db = createTestClient();
const NOW = new Date("2026-10-15T03:00:00Z");
const minutes = (n: number) => new Date(NOW.getTime() + n * 60_000);

beforeEach(async () => {
  await resetDatabase(db);
  await db.staffUser.create({ data: { email: "staff@example.com", name: "Linh", role: "STAFF" } });
  await db.staffUser.create({
    data: { email: "former@example.com", name: "Former", role: "STAFF", active: false },
  });
});
afterAll(() => db.$disconnect());

async function signIn(email = "staff@example.com") {
  const link = await createLoginToken(db, email, NOW);
  if (!link) throw new Error("no link");
  const session = await consumeLoginToken(db, link.token, minutes(1));
  if (!session) throw new Error("no session");
  return session;
}

describe("sign-in links", () => {
  it("are issued to active staff, ignoring case and spaces in the email", async () => {
    const link = await createLoginToken(db, "  Staff@Example.com ", NOW);
    expect(link?.staff.name).toBe("Linh");
  });

  it("are not issued to unknown or deactivated emails", async () => {
    expect(await createLoginToken(db, "stranger@example.com", NOW)).toBeNull();
    expect(await createLoginToken(db, "former@example.com", NOW)).toBeNull();
  });

  it("store only a hash of the token", async () => {
    const link = await createLoginToken(db, "staff@example.com", NOW);
    const row = await db.staffLoginToken.findFirstOrThrow();
    expect(row.tokenHash).toBe(hashToken(link!.token));
    expect(row.tokenHash).not.toContain(link!.token);
  });

  it("stop after 5 requests in 15 minutes, then allow more later", async () => {
    for (let i = 0; i < 5; i++)
      expect(await createLoginToken(db, "staff@example.com", NOW)).not.toBeNull();
    expect(await createLoginToken(db, "staff@example.com", minutes(1))).toBeNull();
    expect(await createLoginToken(db, "staff@example.com", minutes(16))).not.toBeNull();
  });

  it("can be looked at without being used up", async () => {
    const link = await createLoginToken(db, "staff@example.com", NOW);
    expect((await peekLoginToken(db, link!.token, minutes(1)))?.name).toBe("Linh");
    expect(await consumeLoginToken(db, link!.token, minutes(2))).not.toBeNull();
  });

  it("work once only", async () => {
    const link = await createLoginToken(db, "staff@example.com", NOW);
    expect(await consumeLoginToken(db, link!.token, minutes(1))).not.toBeNull();
    expect(await consumeLoginToken(db, link!.token, minutes(2))).toBeNull();
    expect(await peekLoginToken(db, link!.token, minutes(2))).toBeNull();
  });

  it("can't be used twice even by two clicks at the same moment", async () => {
    const link = await createLoginToken(db, "staff@example.com", NOW);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => consumeLoginToken(db, link!.token, minutes(1))),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await db.staffSession.count()).toBe(1);
  });

  it("expire after 15 minutes", async () => {
    const link = await createLoginToken(db, "staff@example.com", NOW);
    expect(await consumeLoginToken(db, link!.token, minutes(15))).toBeNull();
  });

  it("stop working if the staff member is deactivated", async () => {
    const link = await createLoginToken(db, "staff@example.com", NOW);
    await db.staffUser.update({ where: { email: "staff@example.com" }, data: { active: false } });
    expect(await consumeLoginToken(db, link!.token, minutes(1))).toBeNull();
  });

  it("refuse made-up tokens", async () => {
    expect(await consumeLoginToken(db, "not-a-real-token", NOW)).toBeNull();
  });
});

describe("sessions", () => {
  it("identify the staff member for 30 days", async () => {
    const { sessionToken } = await signIn();
    expect(await findSessionStaff(db, sessionToken, minutes(60))).toMatchObject({
      name: "Linh",
      role: "STAFF",
    });
    expect(await findSessionStaff(db, sessionToken, minutes(31 * 24 * 60))).toBeNull();
  });

  it("end on sign-out", async () => {
    const { sessionToken } = await signIn();
    await endSession(db, sessionToken);
    expect(await findSessionStaff(db, sessionToken, minutes(2))).toBeNull();
  });

  it("end at once when the staff member is deactivated", async () => {
    const { sessionToken } = await signIn();
    await db.staffUser.update({ where: { email: "staff@example.com" }, data: { active: false } });
    expect(await findSessionStaff(db, sessionToken, minutes(2))).toBeNull();
  });
});
