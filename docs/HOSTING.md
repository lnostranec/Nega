# Хостинг и развёртывание

Сайт работает на собственном VPS в России. Ниже — что где лежит и как обслуживать.

## Сервер

| Параметр | Значение |
|---|---|
| Провайдер | Рег.облако (Reg.ru) |
| IP | `129.101.94.185` |
| ОС | Ubuntu 24.04 LTS |
| Ресурсы | 2 vCPU, 4 ГБ RAM, 30 ГБ SSD, swap 2 ГБ |
| Домен | `negalingerie.ru` (+ `www`) |
| HTTPS | Let's Encrypt, автопродление через certbot |
| Вход | только по SSH-ключу, пароль отключён |

## Что где лежит

| Что | Путь |
|---|---|
| Код проекта | `/var/www/nega` |
| Переменные окружения | `/var/www/nega/.env` (права 600, владелец www-data) |
| Сервис приложения | `systemd` → `nega.service` |
| Конфиг nginx | `/etc/nginx/sites-available/nega.conf` |
| Бэкапы базы и фото | `/var/backups/nega` (14 дней) |
| Фотографии товаров | `/var/www/nega/public/uploads` (входят в бэкап) |
| Скрипт обновления | `/usr/local/bin/nega-deploy` |
| Скрипт бэкапа | `/usr/local/bin/nega-backup.sh` |

## База данных

- PostgreSQL 16, локально на том же сервере;
- база `negas_shop`, пользователь `nega`;
- пароль — в `DATABASE_URL` внутри `.env`;
- миграции: `npx prisma migrate deploy` из `/var/www/nega`.

## Полезные команды

```bash
# обновить сайт до последнего коммита master
nega-deploy

# статус и логи приложения
systemctl status nega
journalctl -u nega -n 100 --no-pager

# перезапуск
systemctl restart nega

# бэкап вручную
nega-backup.sh

# продлить сертификат (обычно автоматически)
certbot renew --dry-run
```

## Расписания (cron)

| Когда | Что |
|---|---|
| каждые 10 минут | `/api/cron/jobs` — очередь писем, снятие просроченных резервов |
| 03:30 ежедневно | дамп базы в `/var/backups/nega` |

## DNS (зона в ISPmanager Рег.ру)

| Тип | Имя | Значение |
|---|---|---|
| A | `negalingerie.ru` | `129.101.94.185` |
| A | `www.negalingerie.ru` | `129.101.94.185` |
| CNAME | `rsend.negalingerie.ru` | `rsend-euw1.forge.rmta.net` |
| CNAME | `send.negalingerie.ru` | `send.forge.rmta.net` |
| TXT | `resend._domainkey` | DKIM от Resend |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |
| TXT | `negalingerie.ru` | `yandex-verification: …` |
| MX | `negalingerie.ru` | `mx1/mx2.hosting.reg.ru` (почта Рег.ру) |

Записи `AAAA` для корня и `www` удалены сознательно: у сервера нет IPv6.

## Внешние сервисы

| Сервис | Где настраивается |
|---|---|
| ЮKassa (ShopID 1438625) | кабинет ЮKassa → HTTP-уведомления → `https://negalingerie.ru/api/payments/yookassa` |
| Resend (письма) | домен `negalingerie.ru`, отправитель `orders@negalingerie.ru` |
| Фото | диск сервера: `public/uploads`, входят в ежедневный бэкап |
| СДЭК | ключи в `.env` |
| ВКонтакте | `VK_TOKEN`, `VK_PEER_ID` в `.env` |

## Что осталось от прежней инфраструктуры

- **Vercel** — старый адрес `nega-phi.vercel.app`, оставлен как резерв.
- **Яндекс Облако** — больше не используется: кластер PostgreSQL остановлен, фото перенесены на сервер, S3 в приложении отключён. Бакет `nega-media` можно удалить, когда убедитесь, что всё работает (копия файлов уже на сервере).
