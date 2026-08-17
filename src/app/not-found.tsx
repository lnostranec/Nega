import Link from "next/link";
import { SiteContainer } from "@/components/layout/SiteContainer";

export default function NotFound() {
  return (
    <SiteContainer className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">404</p>
      <h1 className="mt-4 font-serif text-3xl text-[#260402] sm:text-4xl">
        Страница не найдена
      </h1>
      <p className="mt-4 max-w-md text-sm text-stone-500">
        Возможно, ссылка устарела или страница была перемещена.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="btn-site btn-site-filled bg-brand px-8 py-3 text-xs font-medium uppercase tracking-widest text-white"
        >
          На главную
        </Link>
        <Link
          href="/catalog"
          className="btn-site border border-brand px-8 py-3 text-xs font-medium uppercase tracking-widest text-brand"
        >
          В каталог
        </Link>
      </div>
    </SiteContainer>
  );
}
