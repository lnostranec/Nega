# Чеклист запуска Nega

Документ для команды перед продакшеном. Плейсхолдеры `[…]` заполняет заказчик / юрист.

## 1. Инфраструктура

- [ ] `DATABASE_URL` на проде (PostgreSQL)
- [ ] `NEXT_PUBLIC_SITE_URL` = боевой HTTPS-домен
- [ ] Деплой на Vercel (или аналог), SSL включён
- [ ] `npm run db:migrate` / `prisma migrate deploy` на проде
- [ ] Админ: `ADMIN_EMAIL` / `ADMIN_PASSWORD` при seed или вручную

## 2. Оплата

### ЮKassa (карта)
- [ ] `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
- [ ] Webhook: `/api/payments/yookassa`

### Долями
- [ ] `DOLYAMI_LOGIN`, `DOLYAMI_PASSWORD`
- [ ] `DOLYAMI_WEBHOOK_SECRET` (если выдан)
- [ ] Webhook: `/api/payments/dolyami`
- [ ] Тест: checkout → Долями → редирект → статус PAID

### Яндекс Сплит (Яндекс Пэй)
- [ ] `YANDEX_PAY_API_KEY` (+ `YANDEX_PAY_MERCHANT_ID` при необходимости)
- [ ] Callback: `/api/payments/yandex-pay`
- [ ] Для песочницы: `YANDEX_PAY_API_URL=https://sandbox.pay.yandex.ru/api/merchant/v1`
- [ ] Тест: checkout → Сплит → редирект → статус PAID

## 3. Доставка

### СДЭК
- [ ] `CDEK_CLIENT_ID`, `CDEK_CLIENT_SECRET`, `CDEK_FROM_CITY_CODE`

### Яндекс Доставка
- [ ] `YANDEX_DELIVERY_TOKEN`
- [ ] `YANDEX_DELIVERY_FROM_ADDRESS` (+ lat/lon по возможности)
- [ ] `YANDEX_DELIVERY_CONTACT_PHONE`
- [ ] Тест: способ «Яндекс Доставка» в checkout, после оплаты — `yandexClaimId` в админке

## 4. Почта и cron

- [ ] `RESEND_API_KEY`, `EMAIL_FROM`
- [ ] `CRON_SECRET` + Vercel Cron на `/api/cron/jobs` (уже в `vercel.json`)
- [ ] Проверка сброса пароля и писем по статусам

## 5. Аналитика / мониторинг (опционально)

- [ ] `NEXT_PUBLIC_YANDEX_METRIKA_ID`
- [ ] `SENTRY_DSN` (лёгкая отправка ошибок)

## 6. Контент и юр. тексты (заказчик)

- [ ] Реквизиты в оферте / политике: `[ИНН]`, `[ОГРН]`, `[АДРЕС]`, `[ТЕЛЕФОН]`
- [ ] Склад: `[ГОРОД ОТГРУЗКИ]`, `[АДРЕС СКЛАДА]` на `/delivery`
- [ ] Реальные фото товаров (хранилище картинок — отдельная задача)
- [ ] Финальные цены, сток, коллекции
- [ ] Решение по Долями / Сплит / Яндекс Доставке

## 7. Смоук перед открытием

- [ ] `GET /api/health` → `status: ok`
- [ ] Регистрация → логин → сброс пароля
- [ ] Заказ: корзина → checkout → оплата → `/checkout/result`
- [ ] Админка: статус, трек, CSV-экспорт
- [ ] `/sitemap.xml`, `/robots.txt`
- [ ] Страница 404

## Полезные URL

| Что | URL |
|-----|-----|
| Health | `/api/health` |
| Webhook ЮKassa | `/api/payments/yookassa` |
| Cron | `/api/cron/jobs` |
| CSV заказов | `/api/admin/export/orders` |
| CSV товаров | `/api/admin/export/products` |
