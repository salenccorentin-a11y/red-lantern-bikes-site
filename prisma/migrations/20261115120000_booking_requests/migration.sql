-- Booking requests: the shop accepts or declines each online booking from a
-- link in its email. Every booking gets a random code for that link (existing
-- rows each get their own), and a marker for the "request ran out" email.
ALTER TABLE "Booking" ADD COLUMN "decisionToken" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN "expiryNoticeSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_decisionToken_key" ON "Booking"("decisionToken");
