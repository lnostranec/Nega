-- CreateTable
CREATE TABLE IF NOT EXISTS "HomepageBestseller" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageBestseller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HomepageBestseller_productId_key" ON "HomepageBestseller"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HomepageBestseller_sortOrder_idx" ON "HomepageBestseller"("sortOrder");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HomepageBestseller_productId_fkey'
  ) THEN
    ALTER TABLE "HomepageBestseller"
      ADD CONSTRAINT "HomepageBestseller_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
