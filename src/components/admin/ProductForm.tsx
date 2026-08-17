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
import {
  defaultSetMatrix,
  setMatrixToVariants,
  variantsToSetMatrix,
  type SetMatrixState,
} from "@/lib/admin-set-matrix";
import type {
  AdminProductInput,
  AdminProductOption,
} from "@/lib/admin-products";
import {
  CATALOG_COUNTRY_OPTIONS,
  CATALOG_MATERIAL_OPTIONS,
  CATALOG_STYLE_OPTIONS,
} from "@/lib/catalog-facets";
import {
  DEFAULT_BOTTOM_MODELS,
  SETS_COLLECTION_SLUG,
} from "@/lib/product-sets";
import {
  AdminSetVariantsEditor,
  type AdminSetAddonDraft,
} from "@/components/admin/AdminSetVariantsEditor";

type CollectionOption = { id: string; name: string; slug: string };

type ProductFormProps = {
  productId?: string;
  initial: AdminProductInput;
  collections: CollectionOption[];
  productOptions?: AdminProductOption[];
};

export function ProductForm({
  productId,
  initial,
  collections,
  productOptions = [],
}: ProductFormProps) {
  const router = useRouter();

  const initialIsSet = useMemo(() => {
    const setCollection = collections.find((c) => c.slug === SETS_COLLECTION_SLUG);
    return Boolean(
      setCollection && initial.collectionIds.includes(setCollection.id),
    );
  }, [collections, initial.collectionIds]);

  const initialMatrix = useMemo(
    () =>
      initial.variants.length > 0 && !initialIsSet
        ? variantsToMatrix(initial.variants)
        : defaultVariantMatrix(),
    [initial.variants, initialIsSet],
  );

  const initialSetMatrix = useMemo(() => {
    const setVariants = initial.variants.filter(
      (v) => v.part === "TOP" || v.part === "BOTTOM",
    );
    return setVariants.length > 0
      ? variantsToSetMatrix(
          setVariants.map((v) => ({
            ...v,
            part: (v.part as "TOP" | "BOTTOM") ?? "TOP",
          })),
        )
      : defaultSetMatrix();
  }, [initial.variants]);

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
  const [kitMatrix, setKitMatrix] = useState<SetMatrixState>(initialSetMatrix);
  const [bottomModels, setBottomModels] = useState(
    initial.bottomModels && initial.bottomModels.length > 0
      ? initial.bottomModels.map((m) => ({
          name: m.name,
          isActive: m.isActive ?? true,
        }))
      : DEFAULT_BOTTOM_MODELS.map((name) => ({ name, isActive: true })),
  );
  const [setAddons, setSetAddons] = useState<AdminSetAddonDraft[]>(
    (initial.setAddons ?? []).map((a) => ({
      name: a.name,
      price: a.price,
      imageUrl: a.imageUrl ?? "",
      note: a.note ?? "",
      isActive: a.isActive ?? true,
    })),
  );
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    initial.relatedProductIds ?? [],
  );
  const [relatedSearch, setRelatedSearch] = useState("");
  const [newBottomModel, setNewBottomModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAddon, setUploadingAddon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setCollectionId = collections.find(
    (c) => c.slug === SETS_COLLECTION_SLUG,
  )?.id;
  const isSet = Boolean(
    setCollectionId && collectionIds.includes(setCollectionId),
  );

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

  async function uploadAddonImage(file: File): Promise<string | null> {
    setUploadingAddon(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
      return data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
      return null;
    } finally {
      setUploadingAddon(false);
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
      variants: isSet
        ? setMatrixToVariants(kitMatrix)
        : matrixToVariants(matrix).map((v) => ({ ...v, part: "STANDARD" as const })),
      bottomModels: isSet
        ? bottomModels
            .filter((m) => m.name.trim())
            .map((m, index) => ({
              name: m.name.trim(),
              isActive: m.isActive,
              sortOrder: index,
            }))
        : [],
      setAddons: isSet
        ? setAddons
            .filter((a) => a.name.trim())
            .map((a, index) => ({
              name: a.name.trim(),
              price: a.price,
              imageUrl: a.imageUrl.trim() || null,
              note: a.note.trim() || null,
              isActive: a.isActive,
              sortOrder: index,
            }))
        : [],
      relatedProductIds,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (isSet) {
      if (kitMatrix.colors.length === 0) {
        setError("Добавьте хотя бы один цвет");
        return;
      }
      if (kitMatrix.topSizes.length === 0) {
        setError("Выберите хотя бы один размер верха");
        return;
      }
      if (kitMatrix.bottomSizes.length === 0) {
        setError("Выберите хотя бы один размер низа");
        return;
      }
      if (bottomModels.filter((m) => m.name.trim() && m.isActive).length === 0) {
        setError("Добавьте хотя бы одну активную модель низа");
        return;
      }
    } else {
      if (matrix.colors.length === 0) {
        setError("Добавьте хотя бы один цвет");
        return;
      }
      if (matrix.sizes.length === 0) {
        setError("Выберите хотя бы один размер");
        return;
      }
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
      {isSet ? (
        <AdminSetVariantsEditor
          matrix={kitMatrix}
          setMatrix={setKitMatrix}
          newColor={newColor}
          setNewColor={setNewColor}
          bottomModels={bottomModels}
          setBottomModels={setBottomModels}
          newBottomModel={newBottomModel}
          setNewBottomModel={setNewBottomModel}
          setAddons={setAddons}
          setSetAddons={setSetAddons}
          onUploadAddonImage={uploadAddonImage}
          uploadingAddon={uploadingAddon}
        />
      ) : (
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
      )}

      {/* Характеристики */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Характеристики</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-stone-600">Коллекция</label>
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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-stone-900">
            Вам может понравиться
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Товары для блока на карточке. Порядок = порядок на сайте (до 4
            позиций). Если ничего не выбрано — подставятся товары из той же
            коллекции.
          </p>
        </div>

        {relatedProductIds.length > 0 && (
          <ul className="space-y-2">
            {relatedProductIds.map((id, index) => {
              const option = productOptions.find((p) => p.id === id);
              if (!option) return null;
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-3 rounded border border-stone-200 px-3 py-2"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
                    {option.imageUrl ? (
                      <Image
                        src={option.imageUrl}
                        alt={option.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">
                      {option.name}
                    </p>
                    <p className="text-xs text-stone-400">{option.slug}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setRelatedProductIds((prev) => {
                          const next = [...prev];
                          [next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ];
                          return next;
                        })
                      }
                      className="px-2 py-1 text-sm text-stone-500 disabled:opacity-30"
                      aria-label="Выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === relatedProductIds.length - 1}
                      onClick={() =>
                        setRelatedProductIds((prev) => {
                          const next = [...prev];
                          [next[index], next[index + 1]] = [
                            next[index + 1],
                            next[index],
                          ];
                          return next;
                        })
                      }
                      className="px-2 py-1 text-sm text-stone-500 disabled:opacity-30"
                      aria-label="Ниже"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRelatedProductIds((prev) =>
                          prev.filter((x) => x !== id),
                        )
                      }
                      className="text-sm text-red-600 hover:underline"
                    >
                      Убрать
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div>
          <input
            value={relatedSearch}
            onChange={(e) => setRelatedSearch(e.target.value)}
            placeholder="Поиск товара для добавления…"
            className="w-full border border-stone-300 px-3 py-2 text-sm"
          />
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded border border-stone-200">
            {productOptions
              .filter((p) => !relatedProductIds.includes(p.id))
              .filter((p) => {
                const q = relatedSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.slug.toLowerCase().includes(q)
                );
              })
              .slice(0, 30)
              .map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={relatedProductIds.length >= 8}
                    onClick={() =>
                      setRelatedProductIds((prev) =>
                        prev.includes(option.id)
                          ? prev
                          : [...prev, option.id],
                      )
                    }
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50 disabled:opacity-40"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-stone-100">
                      {option.imageUrl ? (
                        <Image
                          src={option.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : null}
                    </div>
                    <span className="min-w-0 flex-1 truncate">
                      {option.name}
                      {!option.isActive && (
                        <span className="ml-2 text-xs text-stone-400">
                          (скрыт)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-stone-400">Добавить</span>
                  </button>
                </li>
              ))}
            {productOptions.length === 0 && (
              <li className="px-3 py-4 text-sm text-stone-500">
                Других товаров пока нет
              </li>
            )}
          </ul>
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
