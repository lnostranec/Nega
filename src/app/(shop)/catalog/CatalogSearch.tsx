"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  initialQuery?: string;
};

export function CatalogSearch({ initialQuery = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/catalog?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full sm:max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
        className="w-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-stone-900"
      />
    </form>
  );
}
