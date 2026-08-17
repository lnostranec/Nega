"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  addSetColor,
  allBottomSizes,
  allTopSizes,
  getSetStock,
  removeSetColor,
  setSetStock,
  toggleSetSize,
  type SetMatrixState,
} from "@/lib/admin-set-matrix";

export type AdminSetAddonDraft = {
  name: string;
  price: number;
  imageUrl: string;
  note: string;
  isActive: boolean;
};

type AdminSetVariantsEditorProps = {
  matrix: SetMatrixState;
  setMatrix: React.Dispatch<React.SetStateAction<SetMatrixState>>;
  newColor: string;
  setNewColor: (value: string) => void;
  bottomModels: { name: string; isActive: boolean }[];
  setBottomModels: React.Dispatch<
    React.SetStateAction<{ name: string; isActive: boolean }[]>
  >;
  newBottomModel: string;
  setNewBottomModel: (value: string) => void;
  setAddons: AdminSetAddonDraft[];
  setSetAddons: React.Dispatch<React.SetStateAction<AdminSetAddonDraft[]>>;
  onUploadAddonImage: (file: File) => Promise<string | null>;
  uploadingAddon: boolean;
};

function StockTable({
  title,
  colors,
  sizes,
  stock,
  onChange,
}: {
  title: string;
  colors: string[];
  sizes: string[];
  stock: Record<string, number>;
  onChange: (color: string, size: string, value: number) => void;
}) {
  if (colors.length === 0 || sizes.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-sm font-medium text-stone-700">{title}</p>
      <p className="mb-2 text-sm text-stone-500">
        Остаток (0 = нет в наличии)
      </p>
      <table className="min-w-full border border-stone-200 text-sm">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Цвет / Размер</th>
            {sizes.map((size) => (
              <th key={size} className="px-2 py-2 text-center font-medium">
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colors.map((color) => (
            <tr key={color} className="border-t border-stone-100">
              <td className="px-3 py-2 font-medium">{color}</td>
              {sizes.map((size) => {
                const value = getSetStock(stock, color, size);
                const out = value === 0;
                return (
                  <td key={size} className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) =>
                        onChange(color, size, Number(e.target.value))
                      }
                      className={`w-12 border px-1 py-1 text-center ${
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
  );
}

export function AdminSetVariantsEditor({
  matrix,
  setMatrix,
  newColor,
  setNewColor,
  bottomModels,
  setBottomModels,
  newBottomModel,
  setNewBottomModel,
  setAddons,
  setSetAddons,
  onUploadAddonImage,
  uploadingAddon,
}: AdminSetVariantsEditorProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-stone-900">
          Комплект: цвета, размеры верха и низа
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Товар в категории «Комплекты» — отдельно остатки по размеру верха и
          низа, плюс модели низа.
        </p>
      </div>

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
                onClick={() => setMatrix((m) => removeSetColor(m, color))}
                className="text-stone-400 hover:text-red-600"
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
            placeholder="Новый цвет"
            className="flex-1 border border-stone-300 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setMatrix((m) => addSetColor(m, newColor));
                setNewColor("");
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMatrix((m) => addSetColor(m, newColor));
              setNewColor("");
            }}
          >
            Добавить
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm text-stone-600">Размеры верха</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {allTopSizes().map((size) => (
            <label key={size} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={matrix.topSizes.includes(size)}
                onChange={(e) =>
                  setMatrix((m) =>
                    toggleSetSize(m, "top", size, e.target.checked),
                  )
                }
              />
              {size}
            </label>
          ))}
        </div>
      </div>

      <StockTable
        title="Остатки — размер верха"
        colors={matrix.colors}
        sizes={matrix.topSizes}
        stock={matrix.topStock}
        onChange={(color, size, value) =>
          setMatrix((m) => setSetStock(m, "top", color, size, value))
        }
      />

      <div>
        <label className="text-sm text-stone-600">Размеры низа</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {allBottomSizes().map((size) => (
            <label key={size} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={matrix.bottomSizes.includes(size)}
                onChange={(e) =>
                  setMatrix((m) =>
                    toggleSetSize(m, "bottom", size, e.target.checked),
                  )
                }
              />
              {size}
            </label>
          ))}
        </div>
      </div>

      <StockTable
        title="Остатки — размер низа"
        colors={matrix.colors}
        sizes={matrix.bottomSizes}
        stock={matrix.bottomStock}
        onChange={(color, size, value) =>
          setMatrix((m) => setSetStock(m, "bottom", color, size, value))
        }
      />

      <div>
        <label className="text-sm text-stone-600">Модели низа</label>
        <ul className="mt-2 space-y-2">
          {bottomModels.map((model, index) => (
            <li
              key={`${model.name}-${index}`}
              className="flex flex-wrap items-center gap-3 rounded border border-stone-200 px-3 py-2"
            >
              <input
                value={model.name}
                onChange={(e) =>
                  setBottomModels((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, name: e.target.value } : item,
                    ),
                  )
                }
                className="min-w-0 flex-1 border border-stone-300 px-2 py-1.5 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={model.isActive}
                  onChange={(e) =>
                    setBottomModels((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, isActive: e.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Активна
              </label>
              <button
                type="button"
                onClick={() =>
                  setBottomModels((prev) => prev.filter((_, i) => i !== index))
                }
                className="text-sm text-red-600 hover:underline"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            value={newBottomModel}
            onChange={(e) => setNewBottomModel(e.target.value)}
            placeholder="Новая модель низа"
            className="flex-1 border border-stone-300 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const name = newBottomModel.trim();
                if (!name) return;
                setBottomModels((prev) => [...prev, { name, isActive: true }]);
                setNewBottomModel("");
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const name = newBottomModel.trim();
              if (!name) return;
              setBottomModels((prev) => [...prev, { name, isActive: true }]);
              setNewBottomModel("");
            }}
          >
            Добавить модель
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2">
          <h3 className="text-base font-medium text-stone-900">
            Добавить к заказу
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Допы только для комплектов (трусы и другие позиции). На карточке
            товара показываются активные позиции с фото и ценой «+».
          </p>
        </div>
        <ul className="space-y-4">
          {setAddons.map((addon, index) => (
            <li
              key={index}
              className="space-y-3 rounded border border-stone-200 p-4"
            >
              <div className="flex flex-wrap gap-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-50">
                  {addon.imageUrl ? (
                    <Image
                      src={addon.imageUrl}
                      alt={addon.name || "Доп"}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-stone-400">
                      Нет фото
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={addon.name}
                    onChange={(e) =>
                      setSetAddons((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, name: e.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Название (например, Трусы)"
                    className="w-full border border-stone-300 px-2 py-1.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-sm text-stone-600">
                      Цена, ₽
                      <input
                        type="number"
                        min={0}
                        value={addon.price}
                        onChange={(e) =>
                          setSetAddons((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    price: Math.max(
                                      0,
                                      Number(e.target.value) || 0,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        className="w-28 border border-stone-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={addon.isActive}
                        onChange={(e) =>
                          setSetAddons((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, isActive: e.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                      Активен
                    </label>
                  </div>
                  <input
                    value={addon.note}
                    onChange={(e) =>
                      setSetAddons((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, note: e.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Подпись (необязательно)"
                    className="w-full border border-stone-300 px-2 py-1.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
                        {uploadingAddon ? "Загрузка…" : "Загрузить фото"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingAddon}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          const url = await onUploadAddonImage(file);
                          if (!url) return;
                          setSetAddons((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, imageUrl: url } : item,
                            ),
                          );
                        }}
                      />
                    </label>
                    {addon.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setSetAddons((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, imageUrl: "" } : item,
                            ),
                          )
                        }
                        className="text-sm text-stone-500 hover:underline"
                      >
                        Убрать фото
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setSetAddons((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      className="text-sm text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            setSetAddons((prev) => [
              ...prev,
              {
                name: "",
                price: 0,
                imageUrl: "",
                note: "",
                isActive: true,
              },
            ])
          }
        >
          Добавить позицию
        </Button>
      </div>
    </section>
  );
}
