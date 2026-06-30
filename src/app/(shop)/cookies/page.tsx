import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";
import { SHOP_NAME } from "@/lib/constants";

export const metadata = { title: "Согласие на использование cookie" };

export default function CookiesPage() {
  return (
    <InfoPage title="Согласие на использование cookie">
      <p>
        На сайте {SHOP_NAME} используются файлы cookie и аналогичные технологии
        для обеспечения работы сервиса, анализа посещаемости и улучшения
        пользовательского опыта. Настоящий документ описывает, какие cookie мы
        применяем и как вы можете управлять ими.
      </p>

      <InfoPage.Section title="Что такое cookie">
        <p>
          Cookie — это небольшие текстовые файлы, которые сохраняются в браузере
          при посещении сайта. Они помогают запоминать ваши настройки, содержимое
          корзины и предпочтения.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Какие cookie мы используем">
        <p>
          <strong>Необходимые</strong> — обеспечивают работу корзины, избранного,
          авторизации и сохранения согласия на cookie.
        </p>
        <p>
          <strong>Аналитические</strong> — помогают понять, как посетители
          используют сайт (например, Яндекс.Метрика). Собирают обезличенную
          статистику.
        </p>
        <p>
          <strong>Функциональные</strong> — запоминают выбранные параметры и
          улучшают удобство навигации.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Как дать или отозвать согласие">
        <p>
          При первом посещении сайта вы видите уведомление о cookie. Нажимая
          «Принимаю», вы соглашаетесь на использование файлов cookie в
          соответствии с настоящим документом. Вы можете удалить cookie в
          настройках браузера в любой момент.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Связь с политикой конфиденциальности">
        <p>
          Подробнее о том, как мы обрабатываем персональные данные, читайте в{" "}
          <Link href="/privacy" className="text-[#260402] underline underline-offset-2">
            Политике конфиденциальности
          </Link>
          .
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Контакты">
        <p>
          Вопросы по использованию cookie: support@nega.ru.
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
