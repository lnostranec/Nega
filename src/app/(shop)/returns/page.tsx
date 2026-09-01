import { InfoPage } from "@/components/info/InfoPage";
import { formatSellerPhone, SELLER } from "@/lib/seller";

export const metadata = { title: "Отмена заказа" };

export default function ReturnsPage() {
  return (
    <InfoPage title="Отмена">
      <p>
        Ниже приведены общие условия отмены заказа. Финальная редакция документа
        будет опубликована после согласования с юристом и учётом требований
        законодательства РФ.
      </p>

      <InfoPage.Section title="Когда можно отменить">
        <p>
          Заказ можно отменить, пока он не передан в службу доставки. Чем раньше
          вы напишете нам, тем выше вероятность быстрой отмены без отправки.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Как оформить отмену">
        <p>
          Свяжитесь с клиентским сервисом по email{" "}
          <a href={`mailto:${SELLER.email}`} className="text-[#260402] underline">
            {SELLER.email}
          </a>{" "}
          или по телефону {formatSellerPhone()}. Укажите номер заказа и причину
          отмены.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Возврат денежных средств">
        <p>
          Если заказ уже оплачен, возврат средств осуществляется тем же
          способом, которым была произведена оплата, в срок до 10 рабочих дней
          после подтверждения отмены.
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
