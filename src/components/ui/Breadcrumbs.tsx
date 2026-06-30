import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Хлебные крошки" className="text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition hover:text-[#260402]">
                {item.label}
              </Link>
            ) : (
              <span className="text-stone-400">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
