"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import {
  addColor,
  allSizes,
  defaultVariantMatrix,
  getStock,
  matrixToVariants,
  removeColor,
  setStock,
  toggleSize,
  variantsToMatrix,
  type VariantMatrixState,
} from "@/lib/admin-variant-matrix";
import type { AdminProductInput } from "@/lib/admin-products";
import {
  CATALOG_COUNTRY_OPTIONS,
  CATALOG_MATERIAL_OPTIONS,
  CATALOG_STYLE_OPTIONS,
} from "@/lib/catalog-facets";

type CollectionOption = { id: string; name: string; slug: string };

type ProductFormProps = {
  productId?: string;
  initial: AdminProductInput;
  collections: CollectionOption[];
};

export function ProductForm({ productId, initial, collections }: ProductFormProps) {
  const router = useRouter();

  const initialMatrix = useMemo(
    () =>
      initial.variants.length > 0
        ? variantsToMatrix(initial.variants)
        : defaultVariantMatrix(),
    [initial.variants],
  );

  const initialOnSale = Boolean(
    initial.comparePrice && initial.comparePrice > initial.price,
  );

  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [sku, setSku] = useState(initial.sku ?? "");
  const [isActive, setIsActive] = useState(initial.isActive ?? true);
  const [collectionIds, setCollectionIds] = useState(initial.collectionIds);
  const [imageUrls, setImageUrls] = useState(initial.imageUrls);
  const [description, setDescription] = useState(initial.description ?? "");
  const [composition, setComposition] = useState(initial.composition ?? "");
  const [care, setCare] = useState(initial.care ?? "");
  const [style, setStyle] = useState(initial.style ?? "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [material, setMaterial] = useState(initial.material ?? "");
  const [onSale, setOnSale] = useState(initialOnSale);
  const [regularPrice, setRegularPrice] = useState(
    initialOnSale ? initial.comparePrice! : initial.price,
  );
  const [salePrice, setSalePrice] = useState(
    initialOnSale ? initial.price : initial.price,
  );
  const [matrix, setMatrix] = useState<VariantMatrixState>(initialMatrix);
  const [newColor, setNewColor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function moveImage(index: number, direction: -1 | 1) {
    setImageUrls((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setMainImage(index: number) {
    if (index === 0) return;
    setImageUrls((prev) => {
      const next = [...prev];
      const [img] = next.splice(index, 1);
      next.unshift(img);
      return next;
    });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
      setImageUrls((prev) => [...prev, data.url as string]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  function buildPayload(): AdminProductInput {
    const price = onSale ? salePrice : regularPrice;
    const comparePrice =
      onSale && regularPrice > salePrice ? regularPrice : null;

    return {
      name,
      slug: slug || undefined,
      description,
      composition,
      care,
      style: style || null,
      country: country || null,
      material: material || null,
      price,
      comparePrice,
      sku,
      isActive,
      collectionIds,
      imageUrls,
      variants: matrixToVariants(matrix),
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (matrix.colors.length === 0) {
      setError("Добавьте хотя бы один цвет");
      return;
    }
    if (matrix.sizes.length === 0) {
      setError("Выберите хотя бы один размер");
      return;
    }
    if (onSale && salePrice >= regularPrice) {
      setError("Цена со скидкой должна быть ниже обычной");
      return;
    }

    setLoading(true);
    const payload = buildPayload();
    const url = productId
      ? `/api/admin/products/${productId}`
      : "/api/admin/products";
    const method = productId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сохранить");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Не удалось сохранить товар");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!productId || !confirm("Удалить товар?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError("Не удалось удалить товар");
      setLoading(false);
    }
  }

  const previewPrice = onSale ? salePrice : regularPrice;
  const previewCompare = onSale && regularPrice > salePrice ? regularPrice : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Основное */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Основное</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="text-sm text-stone-600">Название *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600">URL (slug)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Авто из названия"
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600">Артикул</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Показывать в каталоге
          </label>
        </div>
        <div>
          <label className="text-sm text-stone-600">Категории каталога</label>
          <div className="mt-2 flex flex-wrap gap-3 rounded border border-stone-200 p-3">
            {collections.map((col) => (
              <label key={col.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collectionIds.includes(col.id)}
                  onChange={(e) => {
                    setCollectionIds((prev) =>
                      e.target.checked
                        ? [...prev, col.id]
                        : prev.filter((id) => id !== col.id),
                    );
                  }}
                />
                {col.name}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Фото */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Фотографии</h2>
        <p className="text-sm text-stone-500">
          Первое фото — основное в карточке и на странице товара. Остальные — миниатюры в галерее.
        </p>

        {imageUrls.length > 0 && (
          <div className="relative mx-auto aspect-[3/4] max-w-[200px] overflow-hidden bg-stone-50">
            <Image
              src={imageUrls[0]}
              alt="Основное фото"
              fill
              className="object-contain p-2"
            />
            <span className="absolute left-2 top-2 bg-[#260402] px-2 py-0.5 text-[10px] uppercase text-white">
              Главное
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, index) => (
            <div key={`${url}-${index}`} className="space-y-1.5">
              <div className="relative h-24 w-20 bg-stone-50">
                <Image src={url} alt="" fill className="object-contain p-1" />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-[#260402]/80 py-0.5 text-center text-[9px] text-white">
                    Главное
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveImage(index, -1)}
                  className="cursor-pointer px-1 text-[10px] uppercase tracking-wide text-stone-500 transition hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Влево
                </button>
                <button
                  type="button"
                  disabled={index === imageUrls.length - 1}
                  onClick={() => moveImage(index, 1)}
                  className="cursor-pointer px-1 text-[10px] uppercase tracking-wide text-stone-500 transition hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Вправо
                </button>
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setMainImage(index)}
                    title="Сделать главным"
                    className="cursor-pointer px-1 text-[10px] uppercase tracking-wide text-stone-500 transition hover:text-stone-900"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setImageUrls((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label="Удалить фото"
                  className="cursor-pointer px-1 text-xl leading-none text-red-500 transition hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-stone-300 bg-stone-50 text-stone-600 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="px-1 text-center text-[10px] uppercase leading-tight tracking-wide">
              добавить фото
            </span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadImage(file);
            e.target.value = "";
          }}
        />
        {uploading && <p className="text-sm text-stone-500">Загрузка...</p>}
      </section>

      {/* Цена */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Цена</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
          />
          Режим SALE (показывать скидку на сайте)
        </label>
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-stone-600">
              {onSale ? "Цена до скидки" : "Цена *"}
            </label>
            <input
              type="number"
              min={0}
              value={regularPrice}
              onChange={(e) => setRegularPrice(Number(e.target.value))}
              required
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          {onSale && (
            <div>
              <label className="text-sm text-stone-600">Цена со скидкой *</label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                required
                className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
        <p className="text-sm text-stone-600">
          На сайте:{" "}
          {previewCompare && (
            <span className="text-stone-400 line-through">
              {formatPrice(previewCompare)}{" "}
            </span>
          )}
          <span className="font-medium text-stone-900">
            {formatPrice(previewPrice)}
          </span>
          {previewCompare && (
            <span className="ml-2 bg-[#260402] px-1.5 py-0.5 text-[10px] uppercase text-white">
              Sale
            </span>
          )}
        </p>
      </section>

      {/* Цвета и размеры */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Цвета и размеры</h2>

        <div>
          <label className="text-sm text-stone-600">Цвета</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {matrix.colors.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-3 py-1 text-sm"
              >
                {color}
                <button
                  type="button"
                  onClick={() => setMatrix((m) => removeColor(m, color))}
                  className="text-stone-400 hover:text-red-600"
                  aria-label={`Удалить цвет ${color}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="Новый цвет, например: Бордо"
              className="flex-1 border border-stone-300 px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setMatrix((m) => addColor(m, newColor));
                  setNewColor("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMatrix((m) => addColor(m, newColor));
                setNewColor("");
              }}
            >
              Добавить
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm text-stone-600">Размеры в линейке</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {allSizes().map((size) => (
              <label key={size} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={matrix.sizes.includes(size)}
                  onChange={(e) =>
                    setMatrix((m) => toggleSize(m, size, e.target.checked))
                  }
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        {matrix.colors.length > 0 && matrix.sizes.length > 0 && (
          <div className="overflow-x-auto">
            <p className="mb-2 text-sm text-stone-500">
              Остаток по ячейкам (0 = нет в наличии, размер будет неактивен)
            </p>
            <table className="min-w-full border border-stone-200 text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Цвет / Размер</th>
                  {matrix.sizes.map((size) => (
                    <th key={size} className="px-3 py-2 text-center font-medium">
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.colors.map((color) => (
                  <tr key={color} className="border-t border-stone-100">
                    <td className="px-3 py-2 font-medium">{color}</td>
                    {matrix.sizes.map((size) => {
                      const stock = getStock(matrix, color, size);
                      const out = stock === 0;
                      return (
                        <td key={size} className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={stock}
                            onChange={(e) =>
                              setMatrix((m) =>
                                setStock(m, color, size, Number(e.target.value)),
                              )
                            }
                            className={`w-14 border px-1 py-1 text-center ${
                              out
                                ? "border-stone-200 bg-stone-50 text-stone-400"
                                : "border-stone-300"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Характеристики */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Характеристики</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-stone-600">Стиль</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Не указан</option>
              {CATALOG_STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-stone-600">Страна производства</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Не указана</option>
              {CATALOG_COUNTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-stone-600">Материал</label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Не указан</option>
              {CATALOG_MATERIAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Тексты */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Описание и уход</h2>
        <div>
          <label className="text-sm text-stone-600">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="text-sm text-stone-600">Состав</label>
            <textarea
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
              rows={3}
              placeholder="85% полиамид, 15% эластан"
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600">Уход</label>
            <textarea
              value={care}
              onChange={(e) => setCare(e.target.value)}
              rows={3}
              placeholder="Ручная стирка при 30 °C"
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-6">
        <Button type="submit" disabled={loading || uploading}>
          {loading ? "Сохранение..." : "Сохранить"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Отмена
        </Button>
        {productId && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleDelete}
            disabled={loading}
            className="ml-auto text-red-700"
          >
            Удалить товар
          </Button>
        )}
      </div>
    </form>
  );
}
