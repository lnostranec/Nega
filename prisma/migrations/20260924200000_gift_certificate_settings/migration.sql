-- CreateTable
CREATE TABLE "GiftCertificateSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "mainImageUrl" TEXT,
    "description" TEXT NOT NULL,
    "deliveryText" TEXT NOT NULL,
    "designs" JSONB NOT NULL,
    "nominals" JSONB NOT NULL,
    "types" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftCertificateSettings_pkey" PRIMARY KEY ("id")
);
