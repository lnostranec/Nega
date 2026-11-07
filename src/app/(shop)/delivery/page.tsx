import { InfoPage } from "@/components/info/InfoPage";
import { SELLER } from "@/lib/seller";

export const metadata = { title: "Доставка" };

export default function DeliveryPage() {
  return (
    <InfoPage title="Доставка">
      <InfoPage.Section title="Доставка по России">
        <p>
          Вы можете выбрать любой удобный способ доставки. Мы бережно упакуем и
          отправим ваш заказ через СДЭК, Яндекс Доставку или Почту России:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-[#260402]">
              До пункта выдачи / отделения:
            </span>
            <ul className="mt-2 list-[circle] space-y-1 pl-5">
              <li>СДЭК: 350&nbsp;₽ (1–5 рабочих дней).</li>
              <li>Яндекс Доставка: 350&nbsp;₽ (1–5 рабочих дней).</li>
              <li>Почта России: 350&nbsp;₽ (сроки зависят от региона).</li>
            </ul>
          </li>
          <li>
            <span className="font-medium text-[#260402]">
              Курьером до двери:
            </span>{" "}
            450&nbsp;₽ (СДЭК / Яндекс).
          </li>
          <li>
            <span className="font-medium text-[#260402]">Постамат:</span>{" "}
            290&nbsp;₽ (доступно в крупных городах).
          </li>
          <li>
            <span className="font-medium text-[#260402]">
              Бесплатная доставка:
            </span>{" "}
            при покупке от 2-х комплектов или на сумму от 10&nbsp;000&nbsp;₽
            доставим ваш заказ бесплатно в любой регион РФ (любой из доступных
            служб).
          </li>
        </ul>
      </InfoPage.Section>

      <InfoPage.Section title="Поддержка">
        <p>
          По любым вопросам, связанным со сроками и адресами доставки, пишите
          нам:
        </p>
        <ul className="list-disc space-y-2 pl-5">
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
          <li>
            Email:{" "}
            <a
              href="mailto:nega.store@yandex.ru"
              className="text-[#260402] underline"
            >
              nega.store@yandex.ru
            </a>
          </li>
          <li>Помогаем и отвечаем на сообщения в рабочие часы.</li>
        </ul>
      </InfoPage.Section>
    </InfoPage>
  );
}
