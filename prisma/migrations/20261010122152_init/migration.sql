-- CreateEnum
CREATE TYPE "BikeStatus" AS ENUM ('ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "OccupancyKind" AS ENUM ('BOOKING', 'MAINTENANCE', 'TRANSIT');

-- CreateEnum
CREATE TYPE "City" AS ENUM ('SAIGON', 'HANOI', 'DA_NANG');

-- CreateEnum
CREATE TYPE "AddOnPricing" AS ENUM ('PER_DAY', 'FLAT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'WALK_IN', 'IMPORT');

-- CreateEnum
CREATE TYPE "RateTier" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'MOMO', 'ZALOPAY', 'VNPAY', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('DEPOSIT', 'BALANCE', 'EXTRA', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentKind" AS ENUM ('SERVICE', 'REPAIR', 'DAMAGE', 'ACCIDENT', 'THEFT', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'STAFF');

-- CreateTable
CREATE TABLE "BikeModel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dailyRate" INTEGER NOT NULL,
    "weeklyRate" INTEGER NOT NULL,
    "monthlyRate" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BikeModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bike" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" "BikeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "acquiredOn" DATE,
    "purchaseVnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BikeOccupancy" (
    "id" TEXT NOT NULL,
    "bikeId" TEXT NOT NULL,
    "kind" "OccupancyKind" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "bookingId" TEXT,
    "note" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BikeOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "fromCity" "City" NOT NULL,
    "toCity" "City" NOT NULL,
    "minDays" INTEGER NOT NULL,
    "transitDays" INTEGER,
    "bookableOnline" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteFee" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "bikeModelId" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,

    CONSTRAINT "RouteFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricing" "AddOnPricing" NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "depositVnd" INTEGER NOT NULL DEFAULT 1500000,
    "cleaningGapDays" INTEGER NOT NULL DEFAULT 0,
    "holdHours" INTEGER NOT NULL DEFAULT 24,
    "usdToVndRate" INTEGER NOT NULL DEFAULT 26000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "source" "BookingSource" NOT NULL,
    "bikeModelId" TEXT NOT NULL,
    "bikeId" TEXT,
    "pickupCity" "City" NOT NULL,
    "dropoffCity" "City" NOT NULL,
    "routeId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "rateTier" "RateTier" NOT NULL,
    "dailyRate" INTEGER NOT NULL,
    "rentalVnd" INTEGER NOT NULL,
    "oneWayFeeVnd" INTEGER NOT NULL DEFAULT 0,
    "addOnsVnd" INTEGER NOT NULL DEFAULT 0,
    "totalVnd" INTEGER NOT NULL,
    "depositVnd" INTEGER NOT NULL,
    "balanceVnd" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerNote" TEXT,
    "staffNote" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddOn" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricing" "AddOnPricing" NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalVnd" INTEGER NOT NULL,

    CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BikeIncident" (
    "id" TEXT NOT NULL,
    "bikeId" TEXT NOT NULL,
    "bookingId" TEXT,
    "kind" "IncidentKind" NOT NULL,
    "occurredOn" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "odometerKm" INTEGER,
    "partsVnd" INTEGER NOT NULL DEFAULT 0,
    "labourVnd" INTEGER NOT NULL DEFAULT 0,
    "otherVnd" INTEGER NOT NULL DEFAULT 0,
    "recoveredVnd" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BikeIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BikeModel_slug_key" ON "BikeModel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Bike_plate_key" ON "Bike"("plate");

-- CreateIndex
CREATE INDEX "Bike_modelId_idx" ON "Bike"("modelId");

-- CreateIndex
CREATE INDEX "BikeOccupancy_bikeId_startDate_idx" ON "BikeOccupancy"("bikeId", "startDate");

-- CreateIndex
CREATE INDEX "BikeOccupancy_bookingId_idx" ON "BikeOccupancy"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_fromCity_toCity_key" ON "Route"("fromCity", "toCity");

-- CreateIndex
CREATE UNIQUE INDEX "RouteFee_routeId_bikeModelId_key" ON "RouteFee"("routeId", "bikeModelId");

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_slug_key" ON "AddOn"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_status_holdExpiresAt_idx" ON "Booking"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "Booking_startDate_idx" ON "Booking"("startDate");

-- CreateIndex
CREATE INDEX "Booking_bikeId_idx" ON "Booking"("bikeId");

-- CreateIndex
CREATE INDEX "BookingAddOn_bookingId_idx" ON "BookingAddOn"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "BikeIncident_bikeId_occurredOn_idx" ON "BikeIncident"("bikeId", "occurredOn");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- AddForeignKey
ALTER TABLE "Bike" ADD CONSTRAINT "Bike_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BikeModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeOccupancy" ADD CONSTRAINT "BikeOccupancy_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeOccupancy" ADD CONSTRAINT "BikeOccupancy_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeOccupancy" ADD CONSTRAINT "BikeOccupancy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteFee" ADD CONSTRAINT "RouteFee_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteFee" ADD CONSTRAINT "RouteFee_bikeModelId_fkey" FOREIGN KEY ("bikeModelId") REFERENCES "BikeModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bikeModelId_fkey" FOREIGN KEY ("bikeModelId") REFERENCES "BikeModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeIncident" ADD CONSTRAINT "BikeIncident_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeIncident" ADD CONSTRAINT "BikeIncident_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeIncident" ADD CONSTRAINT "BikeIncident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Hand-written: rules Prisma's schema language can't express ─────────────

-- Lets a GiST index combine "same bike" (=) with "overlapping dates" (&&).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- No double-booking: two active occupancies of the same bike may never share a
-- day. Ranges are inclusive on both ends ('[]'). Released rows (cancelled
-- bookings, lifted blocks) are kept for history and ignored here.
ALTER TABLE "BikeOccupancy"
  ADD CONSTRAINT "BikeOccupancy_no_overlap"
  EXCLUDE USING gist (
    "bikeId" WITH =,
    daterange("startDate", "endDate", '[]') WITH &&
  ) WHERE ("releasedAt" IS NULL);

ALTER TABLE "BikeOccupancy"
  ADD CONSTRAINT "BikeOccupancy_dates_ordered" CHECK ("endDate" >= "startDate");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_dates_ordered" CHECK ("endDate" >= "startDate"),
  ADD CONSTRAINT "Booking_amounts_valid" CHECK (
    "days" >= 1 AND "dailyRate" >= 0 AND "rentalVnd" >= 0 AND "oneWayFeeVnd" >= 0
    AND "addOnsVnd" >= 0 AND "depositVnd" >= 0 AND "balanceVnd" >= 0
    AND "totalVnd" = "rentalVnd" + "oneWayFeeVnd" + "addOnsVnd"
    AND "depositVnd" + "balanceVnd" = "totalVnd"
  );

ALTER TABLE "BikeModel"
  ADD CONSTRAINT "BikeModel_rates_positive"
  CHECK ("dailyRate" > 0 AND "weeklyRate" > 0 AND "monthlyRate" > 0);

ALTER TABLE "Route"
  ADD CONSTRAINT "Route_days_valid"
  CHECK ("minDays" >= 1 AND ("transitDays" IS NULL OR "transitDays" >= 0)),
  ADD CONSTRAINT "Route_one_way" CHECK ("fromCity" <> "toCity");

ALTER TABLE "RouteFee" ADD CONSTRAINT "RouteFee_fee_valid" CHECK ("fee" >= 0);
ALTER TABLE "AddOn" ADD CONSTRAINT "AddOn_price_valid" CHECK ("price" >= 0);

ALTER TABLE "BikeIncident"
  ADD CONSTRAINT "BikeIncident_costs_valid"
  CHECK ("partsVnd" >= 0 AND "labourVnd" >= 0 AND "otherVnd" >= 0 AND "recoveredVnd" >= 0);

-- Settings is a single row.
ALTER TABLE "SiteSettings"
  ADD CONSTRAINT "SiteSettings_single_row" CHECK ("id" = 1),
  ADD CONSTRAINT "SiteSettings_values_valid" CHECK (
    "depositVnd" >= 0 AND "cleaningGapDays" >= 0 AND "holdHours" >= 1 AND "usdToVndRate" > 0
  );
