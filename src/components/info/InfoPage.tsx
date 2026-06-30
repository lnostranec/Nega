import { SiteContainer } from "@/components/layout/SiteContainer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type InfoPageProps = {
  title: string;
  children: React.ReactNode;
};

export function InfoPage({ title, children }: InfoPageProps) {
  return (
    <SiteContainer className="py-10">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: title }]}
      />
      <article className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-semibold uppercase tracking-widest text-[#260402] md:text-3xl">
          {title}
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-600">
          {children}
        </div>
      </article>
    </SiteContainer>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-[#260402]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

InfoPage.Section = Section;
