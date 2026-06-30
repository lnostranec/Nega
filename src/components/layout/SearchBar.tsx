"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { SearchResultItem } from "@/lib/search";
import { SiteContainer } from "./SiteContainer";

type SearchBarProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  /** Не закрывать поиск при клике по этому элементу (кнопка-лупа в шапке) */
  toggleRef?: RefObject<HTMLElement | null>;
};

export function SearchBar({
  open,
  onClose,
  initialQuery = "",
  toggleRef,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      const el = inputRef.current;
      el?.focus();
      el?.setSelectionRange(0, 0);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, onClose]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (toggleRef?.current?.contains(target)) return;
      onClose();
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onClose, toggleRef]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { results: SearchResultItem[] };
        setResults(data.results);
        setShowResults(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const goToCatalog = useCallback(
    (value?: string) => {
      const trimmed = (value ?? query).trim();
      if (trimmed) {
        router.push(`/catalog?q=${encodeURIComponent(trimmed)}`);
      } else {
        router.push("/catalog");
      }
      onClose();
    },
    [query, router, onClose],
  );

  const openProduct = useCallback(
    (slug: string) => {
      router.push(`/product/${slug}`);
      onClose();
    },
    [router, onClose],
  );

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    goToCatalog();
  }

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return (
    <div className="bg-white">
      <SiteContainer>
        <form onSubmit={handleSubmit} className="flex justify-center py-3">
          <div ref={panelRef} className="relative w-full max-w-xl sm:max-w-2xl">
            <div className="flex items-center gap-2 border-b border-stone-300 pb-2">
              <input
                ref={inputRef}
                type="search"
                name="q"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => {
                  if (hasQuery) setShowResults(true);
                }}
                placeholder="Поиск по каталогу..."
                autoComplete="off"
                className="search-input min-w-0 flex-1 border-0 bg-transparent text-left text-sm text-stone-800 outline-none placeholder:text-stone-400"
              />
              <button
                type="submit"
                aria-label="Искать"
                className="shrink-0 text-[#260402] transition hover:opacity-70"
              >
                <SearchIcon />
              </button>
            </div>

            {showResults && hasQuery && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] overflow-y-auto border border-stone-200 bg-white shadow-lg">
                {loading && results.length === 0 && (
                  <p className="px-4 py-3 text-sm text-stone-500">Поиск...</p>
                )}

                {!loading && results.length === 0 && (
                  <p className="px-4 py-3 text-sm text-stone-500">
                    Ничего не найдено
                  </p>
                )}

                {results.length > 0 && (
                  <ul>
                    {results.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => openProduct(product.slug)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50"
                        >
                          <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-stone-50">
                            <Image
                              src={product.imageUrl || PLACEHOLDER_PRODUCT}
                              alt={product.name}
                              fill
                              className="object-contain p-1"
                              sizes="44px"
                            />
                          </div>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-[#260402]">
                              {product.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-stone-600">
                              {formatPrice(product.price)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {results.length > 0 && (
                  <div className="border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => goToCatalog()}
                      className="w-full px-4 py-3 text-left text-sm text-[#260402] transition hover:bg-stone-50"
                    >
                      Все результаты по запросу «{trimmedQuery}»
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </SiteContainer>
    </div>
  );
}
