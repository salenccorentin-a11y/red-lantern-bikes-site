-- Random code for the customer's booking link (/booking/<viewToken>).
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "viewToken" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "Booking_viewToken_key" ON "Booking"("viewToken");
