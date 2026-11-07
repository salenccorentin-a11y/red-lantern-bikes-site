-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "holdReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "pickupReminderSentAt" TIMESTAMP(3);
