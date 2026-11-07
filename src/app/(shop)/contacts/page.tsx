import { SiteContainer } from "@/components/layout/SiteContainer";
import { SELLER } from "@/lib/seller";

export const metadata = { title: "Контакты" };

export default function ContactsPage() {
  return (
    <SiteContainer className="py-16">
      <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold uppercase tracking-widest text-[#260402]">
        Контакты
      </h1>
      <ul className="mt-8 space-y-3 text-stone-600">
        <li>
          Телефон:{" "}
          {SELLER.phones.map((phone, index) => (
            <span key={phone.tel}>
              {index > 0 && ", "}
              <a href={`tel:${phone.tel}`} className="text-[#260402] underline">
                {phone.display}
              </a>
            </span>
          ))}
        </li>
        <li>Email: nega.store@yandex.ru</li>
        <li>
          Telegram:{" "}
          <a
            href={SELLER.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#260402] underline"
          >
            {SELLER.telegram}
          </a>
        </li>
      </ul>
      </div>
    </SiteContainer>
  );
}
