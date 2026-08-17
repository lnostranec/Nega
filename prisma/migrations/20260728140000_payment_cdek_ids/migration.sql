-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "externalPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cdekUuid" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_externalPaymentId_key" ON "Order"("externalPaymentId");
