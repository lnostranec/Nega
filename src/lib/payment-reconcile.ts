import { handleExternalPaymentSucceeded } from "@/lib/payments";
import { getPrisma } from "@/lib/prisma";
import { getYandexPayOrder } from "@/lib/yandex-pay";

const PAID_STATUSES = ["CAPTURED", "SUCCESS", "PAID", "COMPLETED"];

/**
 * Проверяет у Яндекса незавершённые заказы Яндекс Пэя и Сплита.
 * Вебхук от Яндекса приходит не всегда, поэтому раз в 10 минут
 * (из cron) сверяем статусы и подтверждаем оплату сами.
 */
export async function reconcileYandexPayments(): Promise<number> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
      externalPaymentId: { not: null },
      paymentMethod: { in: ["YANDEX_PAY", "YANDEX_SPLIT"] },
      createdAt: { gte: since },
    },
    select: { id: true, externalPaymentId: true },
    take: 50,
  });

  let confirmed = 0;

  for (const order of orders) {
    if (!order.externalPaymentId) continue;

    try {
      const payment = await getYandexPayOrder(order.externalPaymentId);
      const status = (payment.paymentStatus ?? "").toUpperCase();

      if (!PAID_STATUSES.includes(status)) continue;

      await handleExternalPaymentSucceeded(order.externalPaymentId, order.id);
      confirmed += 1;
    } catch (error) {
      console.error(
        "[payments] не удалось сверить платёж",
        order.externalPaymentId,
        error,
      );
    }
  }

  return confirmed;
}
