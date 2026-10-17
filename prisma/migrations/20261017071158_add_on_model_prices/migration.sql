-- AlterTable
ALTER TABLE "AddOn" ADD COLUMN     "maxQuantity" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "AddOnModelPrice" (
    "id" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "bikeModelId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "AddOnModelPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddOnModelPrice_addOnId_bikeModelId_key" ON "AddOnModelPrice"("addOnId", "bikeModelId");

-- AddForeignKey
ALTER TABLE "AddOnModelPrice" ADD CONSTRAINT "AddOnModelPrice_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnModelPrice" ADD CONSTRAINT "AddOnModelPrice_bikeModelId_fkey" FOREIGN KEY ("bikeModelId") REFERENCES "BikeModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
