-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "depositNote" TEXT,
ADD COLUMN     "helmetNote" TEXT,
ADD COLUMN     "insuranceNote" TEXT,
ADD COLUMN     "notionUrl" TEXT,
ADD COLUMN     "paidNote" TEXT,
ADD COLUMN     "problemsNote" TEXT,
ADD COLUMN     "transferNote" TEXT;

-- CreateIndex
CREATE INDEX "Booking_notionUrl_idx" ON "Booking"("notionUrl");

-- Bookings imported from Notion carry the row's link on the first line of the
-- staff note ("Imported from Notion <url>"): copy it to its own column.
UPDATE "Booking"
SET "notionUrl" = substring("staffNote" from '^Imported from Notion (\S+)')
WHERE "source" = 'IMPORT' AND "staffNote" LIKE 'Imported from Notion %';
