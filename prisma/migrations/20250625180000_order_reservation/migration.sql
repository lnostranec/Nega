-- Order payment reservation and gift variant tracking
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentExpiresAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stockReleased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "sourceVariantId" TEXT;
