-- Материал товара становится списком: у комплекта может быть кружево и шёлк.
-- Колонку "material" пока оставляем: на проде ещё работает старый код,
-- удалим её отдельной миграцией после выкладки.

ALTER TABLE "Product" ADD COLUMN "materials" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Product"
SET "materials" = ARRAY["material"]
WHERE "material" IS NOT NULL AND btrim("material") <> '';
