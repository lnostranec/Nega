# Настройка Cron и почты (Resend)

## Cron — Vercel

Секрет уже сгенерирован в `.env` (`CRON_SECRET`).

**Добавить на Vercel** (Settings → Environment Variables → Production):

| Переменная | Значение |
|------------|----------|
| `CRON_SECRET` | скопировать из `.env` |

После деплоя Vercel раз в сутки (03:00 UTC) вызывает `/api/cron/jobs`:
- отменяет неоплаченные заказы старше 15 минут;
- отправляет очередь писем.

Проверка вручную (после деплоя):

```bash
curl -X POST "https://nega-phi.vercel.app/api/cron/jobs" \
  -H "Authorization: Bearer ВАШ_CRON_SECRET"
```

Ответ: `{"expiredOrders":0,"emailsProcessed":0}` — норма.

---

## Почта — Resend

### Шаг 1. Аккаунт и API-ключ

1. [resend.com](https://resend.com) → регистрация
2. **API Keys** → **Create API Key**
3. В `.env` и Vercel:

```env
RESEND_API_KEY=re_xxxxxxxx
```

### Шаг 2а. Быстрый тест (без домена)

```env
EMAIL_FROM=onboarding@resend.dev
```

Письма уходят **только на email аккаунта Resend**. Для проверки логики достаточно.

```bash
node --env-file=.env scripts/test-email.mjs ваш@email.com
```

### Шаг 2б. Боевой адрес (рекомендуется)

**Да — можно настроить финальный адрес сейчас**, ещё до привязки домена к сайту.

1. Зарегистрировать домен (например `nega-shop.ru`) — на себя или сразу на заказчицу
2. Resend → **Domains** → **Add Domain**
3. Добавить DNS-записи у регистратора (SPF, DKIM — Resend покажет что именно)
4. Дождаться статуса **Verified**
5. Указать:

```env
EMAIL_FROM=Nega <orders@nega-shop.ru>
```

Сайт может оставаться на `nega-phi.vercel.app` — **почта и сайт используют один домен, но независимо**. Позже домен привяжете к Vercel для витрины.

### Шаг 3. Vercel

Те же переменные в Production:

| Переменная | Пример |
|------------|--------|
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `Nega <orders@nega-shop.ru>` |
| `SHOP_NAME` | `Nega` |

Перезапустить деплой (Redeploy).

---

## Что уходит клиентам

- Подтверждение заказа
- Оплата получена
- Статус: собирается / отправлен / доставлен / отменён
- Сброс пароля

Без `RESEND_API_KEY` письма только пишутся в лог сервера.
