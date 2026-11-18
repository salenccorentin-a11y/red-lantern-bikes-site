-- CreateEnum
CREATE TYPE "Licence" AS ENUM ('IDP_OR_A1', 'A2');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RateTier" ADD VALUE 'THREE_WEEKS';
ALTER TYPE "RateTier" ADD VALUE 'FORTY_FIVE_DAYS';

-- AlterTable
ALTER TABLE "BikeModel" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fortyFiveDayRate" INTEGER,
ADD COLUMN     "licence" "Licence",
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "threeWeekRate" INTEGER;
