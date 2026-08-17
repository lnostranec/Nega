import { CheckoutResultContent } from "@/components/checkout/CheckoutResultContent";

type Props = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutResultPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-[#260402]">Оплата</h1>
        <p className="mt-4 text-stone-600">Не указан номер заказа.</p>
      </div>
    );
  }

  return <CheckoutResultContent orderId={orderId} />;
}
