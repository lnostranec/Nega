import { InfoPage } from "@/components/info/InfoPage";

export const metadata = { title: "О нас" };

export default function AboutPage() {
  return (
    <InfoPage title="О нас">
      <p>
        Nega — бренд женского белья, в котором комфорт и эстетика идут рядом.
        Мы создаём базовые и выразительные модели для повседневности и особых
        случаев.
      </p>

      <InfoPage.Section title="Наш подход">
        <p>
          Внимательно относимся к посадке, тканям и деталям. Цель — бельё, в
          котором хочется оставаться весь день: мягкое, аккуратное и
          продуманное по конструкции.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Контакты">
        <p>
          Вопросы по заказам и сотрудничеству:{" "}
          <a href="mailto:support@nega.ru" className="text-[#260402] underline">
            support@nega.ru
          </a>
          , телефон +7 (999) 000-00-00.
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
