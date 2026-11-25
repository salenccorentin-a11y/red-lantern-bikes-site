-- AlterTable
ALTER TABLE "BikeModel" ADD COLUMN     "oilIntervalKm" INTEGER NOT NULL DEFAULT 800;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "kmSinceOilChange" INTEGER,
ADD COLUMN     "oilChangedOn" DATE,
ADD COLUMN     "oilReminderSentOn" DATE;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "emailKey" TEXT,
    "phoneKey" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEmail" (
    "kind" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyEmail_pkey" PRIMARY KEY ("kind","day")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_emailKey_key" ON "Customer"("emailKey");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneKey_key" ON "Customer"("phoneKey");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Shop oil rule (owner, 2026-11-24): the CB150X and Versys-X 300 get Motul
-- and are changed every 2,500 km; every other model every 800 km.
UPDATE "BikeModel" SET "oilIntervalKm" = 2500
WHERE "slug" IN ('honda-cb150x', 'kawasaki-versys-x300');
