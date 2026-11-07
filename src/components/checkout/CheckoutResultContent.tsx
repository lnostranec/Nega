"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { GiftCertificateView } from "@/lib/gift-certificate";

type OrderStatusPayload = {
  id: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  paymentStatus: string;
  total: number;
  giftCertificates?: GiftCertificateView[];
};

type Props = {
  orderId: string;
};

export function CheckoutResultContent({ orderId }: Props) {
  const [order, setOrder] = useState<OrderStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setError(data.error ?? "Заказ не найден");
          return;
        }

        const next = data.order as OrderStatusPayload;
        setOrder(next);
        setError(null);

        if (next.paymentStatus === "PENDING") {
          timer = setTimeout(() => {
            void load();
          }, 2500);
        }
      } catch {
        if (!cancelled) setError("Не удалось проверить статус оплаты");
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-[#260402]">Оплата</h1>
        <p className="mt-4 text-stone-600">{error}</p>
        <Link href="/catalog" className="mt-8 inline-block text-sm underline">
          В каталог
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-[#260402]">Оплата</h1>
        <p className="mt-4 text-stone-600">Проверяем статус…</p>
      </div>
    );
  }

  const paid = order.paymentStatus === "PAID";
  const failed =
    order.paymentStatus === "FAILED" || order.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-3xl text-[#260402]">
        {paid ? "Заказ оплачен" : failed ? "Оплата не прошла" : "Ожидаем оплату"}
      </h1>
      <p className="mt-4 text-stone-600">
        Номер заказа:{" "}
        <span className="font-medium text-[#260402]">{order.orderNumber}</span>
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {order.statusLabel} · {formatPrice(order.total)}
      </p>
      {paid && order.giftCertificates && order.giftCertificates.length > 0 && (
        <div className="mt-8 border border-stone-200 bg-stone-50 p-5 text-left">
          <p className="text-sm font-medium text-[#260402]">
            {order.giftCertificates.length > 1
              ? "Коды подарочных сертификатов"
              : "Код подарочного сертификата"}
          </p>
          <ul className="mt-3 space-y-3">
            {order.giftCertificates.map((certificate) => (
              <li key={certificate.code}>
                <p className="font-mono text-lg font-semibold tracking-wider text-stone-900">
                  {certificate.code}
                </p>
                <p className="text-xs text-stone-500">
                  Номинал {formatPrice(certificate.nominal)}
                  {certificate.expiresAt &&
                    ` · действует до ${new Date(certificate.expiresAt).toLocaleDateString("ru-RU")}`}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            Мы также отправили код на email. Введите его в поле «Промокод» при
            оформлении заказа.
          </p>
        </div>
      )}
      {!paid && !failed && (
        <p className="mt-6 text-sm text-stone-500">
          Если вы уже оплатили, статус обновится автоматически в течение минуты.
        </p>
      )}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/catalog"
          className="btn-site btn-site-filled bg-brand px-8 py-3 text-xs font-medium uppercase tracking-widest text-white"
        >
          В каталог
        </Link>
        <Link href="/account" className="text-sm text-stone-600 underline">
          Личный кабинет
        </Link>
      </div>
    </div>
  );
}
