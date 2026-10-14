-- Enquiries from the tour and contact pages.
-- CreateEnum
CREATE TYPE "EnquiryKind" AS ENUM ('TOUR', 'REVERSE_ROUTE', 'GENERAL');

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "kind" "EnquiryKind" NOT NULL,
    "topic" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "preferredStart" DATE,
    "riders" INTEGER,
    "handledAt" TIMESTAMP(3),
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enquiry_handledAt_createdAt_idx" ON "Enquiry"("handledAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

