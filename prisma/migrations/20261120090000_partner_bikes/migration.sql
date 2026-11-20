-- One extra "partner" bike per model, booked only when all the shop's own
-- bikes of that model are taken (owner, 2026-11-20). See Bike.partner.
ALTER TABLE "Bike" ADD COLUMN "partner" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Bike" ("id", "plate", "modelId", "status", "partner", "notes", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'PARTNER-' || upper(m."slug"),
  m."id",
  'ACTIVE',
  true,
  'Not one of ours: booked only when all our own bikes of this model are taken. Find one from a partner.',
  now(),
  now()
FROM "BikeModel" m
WHERE NOT EXISTS (SELECT 1 FROM "Bike" b WHERE b."plate" = 'PARTNER-' || upper(m."slug"));
