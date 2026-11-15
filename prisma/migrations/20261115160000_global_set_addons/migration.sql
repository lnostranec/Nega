-- Допы к комплектам становятся общими: productId = NULL значит «для всех комплектов».

ALTER TABLE "ProductSetAddon" ALTER COLUMN "productId" DROP NOT NULL;

-- Существующий доп livvy делаем общим для всех комплектов.
UPDATE "ProductSetAddon" SET "productId" = NULL;
