"use client";

import Link from "next/link";
import {
  FOOTER_CONTACTS_ID,
  FOOTER_HELP_LINKS,
  FOOTER_LEGAL_LINKS,
  SHOP_NAME,
} from "@/lib/constants";
import { MailIcon, PhoneIcon, TelegramIcon, VkIcon, InstagramIcon } from "@/components/icons";
import { SizeCalculatorButton } from "@/components/size-calculator/SizeCalculatorButton";
import { LeaveReviewButton } from "@/components/reviews/LeaveReviewButton";
import { NewsletterForm } from "./NewsletterForm";
import { SiteContainer } from "./SiteContainer";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <SiteContainer className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 sm:items-start lg:grid-cols-4 lg:gap-8">
          {/* 1 + 3. Помощь и соцсети — на планшете одна колонка */}
          <div className="contents sm:flex sm:flex-col sm:gap-10 sm:col-start-1 sm:row-start-1 lg:contents">
            <div className="lg:col-start-1 lg:row-start-1">
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
              <SizeCalculatorButton className="btn-site btn-site-filled mt-6 inline-block w-full bg-brand px-6 py-3.5 text-center text-sm font-medium text-white" />
            </div>

            <div
              id={FOOTER_CONTACTS_ID}
              className="scroll-mt-28 max-sm:order-3 lg:col-start-3 lg:row-start-1"
            >
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
          </div>

          {/* 2 + 4. Документы и подписка — на планшете одна колонка */}
          <div className="contents sm:flex sm:flex-col sm:gap-10 sm:col-start-2 sm:row-start-1 lg:contents">
            <div className="lg:col-start-2 lg:row-start-1">
              <h3 className="text-base font-semibold text-[#260402]">Документы</h3>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LEGAL_LINKS.map((link) => (
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

            <div className="max-sm:order-4 lg:col-start-4 lg:row-start-1">
              <NewsletterForm />
              <Link
                href="/cookies"
                className="mt-5 block text-sm text-stone-500 transition hover:text-[#260402]"
              >
                Согласие на использование cookie
              </Link>
              <Link
                href="/gift-certificate"
                className="btn-site btn-site-filled mt-6 inline-block w-full bg-brand px-6 py-3.5 text-center text-sm font-medium text-white"
              >
                Подарочный сертификат
              </Link>
              <LeaveReviewButton />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-100 pt-6 text-center">
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
