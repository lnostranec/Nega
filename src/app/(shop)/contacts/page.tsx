import { SiteContainer } from "@/components/layout/SiteContainer";

export const metadata = { title: "Контакты" };

export default function ContactsPage() {
  return (
    <SiteContainer className="py-16">
      <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold uppercase tracking-widest text-[#260402]">
        Контакты
      </h1>
      <ul className="mt-8 space-y-3 text-stone-600">
        <li>Телефон: +7 (999) 000-00-00</li>
        <li>Email: support@nega.ru</li>
        <li>Telegram: @nega_support</li>
      </ul>
      </div>
    </SiteContainer>
  );
}
