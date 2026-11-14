import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";
import { SELLER } from "@/lib/seller";

export const metadata = { title: "Доставка" };

export default function DeliveryPage() {
  return (
    <InfoPage title="Доставка">
      <InfoPage.Section title="Доставка по России">
        <p>
          Отправляем заказы по России через СДЭК. Способ и стоимость доставки
          выбираются при оформлении заказа:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-[#260402]">
              Пункт выдачи СДЭК:
            </span>{" "}
            350&nbsp;₽, срок — 1–5 рабочих дней.
          </li>
          <li>
            <span className="font-medium text-[#260402]">
              Курьером до двери (СДЭК):
            </span>{" "}
            500&nbsp;₽, срок — 1–5 рабочих дней.
          </li>
          <li>
            <span className="font-medium text-[#260402]">
              Бесплатная доставка:
            </span>{" "}
            при заказе на сумму от 10&nbsp;000&nbsp;₽.
          </li>
        </ul>
        <p>
          Точную стоимость и срок для вашего города система рассчитывает при
          оформлении заказа. После передачи посылки в службу доставки мы пришлём
          трек-номер на email.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Отслеживание заказа">
        <p>
          Проверить статус можно на странице{" "}
          <Link
            href="/order/track"
            className="text-[#260402] underline underline-offset-2"
          >
            «Отследить заказ»
          </Link>{" "}
          — по номеру заказа и телефону, указанному при оформлении.
        </p>
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
            ВКонтакте:{" "}
            <a
              href={SELLER.vkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#260402] underline"
            >
              vk.ru/negalingerie
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
          <li>Отвечаем в рабочие дни с 10:00 до 19:00 по московскому времени.</li>
        </ul>
      </InfoPage.Section>
    </InfoPage>
  );
}
