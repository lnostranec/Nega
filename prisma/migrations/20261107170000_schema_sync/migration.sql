-- Догоняющая миграция: приводит схему к prisma/schema.prisma.
-- Часть изменений раньше применялась через `prisma db push`, минуя историю миграций,
-- из-за чего свежая база после `migrate deploy` не совпадала со схемой.

-- CreateEnum
CREATE TYPE "VariantPart" AS ENUM ('STANDARD', 'TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cdekCityCode" INTEGER,
ADD COLUMN     "cdekCityName" TEXT,
ADD COLUMN     "cdekPvzName" TEXT,
ADD COLUMN     "loyaltyDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "bottomModel" TEXT,
ADD COLUMN     "sizeBottom" TEXT,
ADD COLUMN     "sizeTop" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "country" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "pattern" TEXT,
ADD COLUMN     "style" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "part" "VariantPart" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "cdekCourierBaseCost" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "cdekPvzBaseCost" INTEGER NOT NULL DEFAULT 350,
ADD COLUMN     "freeDeliveryFrom" INTEGER DEFAULT 10000,
ADD COLUMN     "loyaltyPercent1" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "loyaltyPercent2" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "loyaltyPercent3" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "loyaltyThreshold1" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "loyaltyThreshold2" INTEGER NOT NULL DEFAULT 30000,
ADD COLUMN     "loyaltyThreshold3" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "yandexDeliveryCost" INTEGER NOT NULL DEFAULT 450;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBottomModel" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductBottomModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSetAddon" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "imageUrl" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSetAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRelated" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductRelated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "template" TEXT,
    "orderId" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "ProductRelated_productId_idx" ON "ProductRelated"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRelated_productId_relatedProductId_key" ON "ProductRelated"("productId", "relatedProductId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBottomModel" ADD CONSTRAINT "ProductBottomModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSetAddon" ADD CONSTRAINT "ProductSetAddon_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelated" ADD CONSTRAINT "ProductRelated_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelated" ADD CONSTRAINT "ProductRelated_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
