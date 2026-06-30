import Link from "next/link";
import { FOOTER_CONTACTS_ID, FOOTER_HELP_LINKS, SHOP_NAME } from "@/lib/constants";
import { MailIcon, PhoneIcon, TelegramIcon, VkIcon, InstagramIcon } from "@/components/icons";
import { NewsletterForm } from "./NewsletterForm";
import { SiteContainer } from "./SiteContainer";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <SiteContainer className="py-12">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Помощь */}
          <div>
            <h3 className="text-base font-semibold text-[#260402]">Помощь</h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-500 transition hover:text-[#260402]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Соцсети и контакты */}
          <div id={FOOTER_CONTACTS_ID} className="scroll-mt-28">
            <h3 className="text-base font-semibold text-[#260402]">Социальные сети</h3>
            <div className="mt-4 flex items-center gap-3 text-[#260402]">
              <a href="#" aria-label="Telegram" className="transition hover:opacity-70">
                <TelegramIcon className="h-5 w-5" />
              </a>
              <a href="#" aria-label="VK" className="transition hover:opacity-70">
                <VkIcon className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Instagram" className="transition hover:opacity-70">
                <InstagramIcon className="h-5 w-5" />
              </a>
            </div>

            <ul className="mt-5 space-y-3 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <MailIcon />
                <a href="mailto:support@nega.ru" className="hover:text-[#260402]">
                  support@nega.ru
                </a>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon />
                <span>+7 (999) 000-00-00 — Клиентский сервис</span>
              </li>
            </ul>

            <h3 className="mt-8 text-base font-semibold text-[#260402]">Сотрудничество</h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-stone-600">
              <MailIcon />
              <a href="mailto:info@nega.ru" className="hover:text-[#260402]">
                info@nega.ru
              </a>
            </p>
          </div>

          {/* Подписка */}
          <NewsletterForm />
        </div>

        <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/gift-certificate"
            className="btn-site btn-site-filled block w-full bg-brand px-10 py-3.5 text-center text-sm font-medium text-white sm:inline-block sm:w-auto"
          >
            Подарочный сертификат
          </Link>
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} {SHOP_NAME}.{" "}
            <Link href="/privacy" className="transition hover:text-[#260402]">
              Политика конфиденциальности
            </Link>
          </p>
        </div>
      </SiteContainer>
    </footer>
  );
}
