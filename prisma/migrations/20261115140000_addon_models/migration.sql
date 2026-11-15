-- Модели дополнительной позиции к комплекту: у каждой своя цена.

CREATE TABLE "ProductSetAddonModel" (
    "id" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ProductSetAddonModel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductSetAddonModel_addonId_idx" ON "ProductSetAddonModel"("addonId");

ALTER TABLE "ProductSetAddonModel"
    ADD CONSTRAINT "ProductSetAddonModel_addonId_fkey"
    FOREIGN KEY ("addonId") REFERENCES "ProductSetAddon"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
