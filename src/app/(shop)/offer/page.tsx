import { InfoPage } from "@/components/info/InfoPage";
import { SHOP_NAME } from "@/lib/constants";
import {
  formatBankDetails,
  formatSellerOgrnip,
  formatSellerPhone,
  SELLER,
} from "@/lib/seller";

export const metadata = { title: "Публичная оферта" };

export default function OfferPage() {
  return (
    <InfoPage title="Публичная оферта">
      <p>
        Настоящий документ является публичной офертой интернет-магазина{" "}
        {SHOP_NAME} (далее — Продавец) и определяет условия продажи товаров
        дистанционным способом.
      </p>

      <InfoPage.Section title="1. Общие положения">
        <p>
          Оформляя заказ на сайте, Покупатель подтверждает согласие с условиями
          настоящей оферты, политикой конфиденциальности и правилами доставки и
          возврата. Оферта вступает в силу с момента её публикации на сайте.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="2. Предмет договора">
        <p>
          Продавец обязуется передать в собственность Покупателя товар,
          представленный на сайте, а Покупатель обязуется оплатить и принять
          товар на условиях настоящей оферты.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="3. Цена и оплата">
        <p>
          Цены на товары указаны в рублях РФ и включают НДС, если применимо.
          Окончательная стоимость заказа формируется с учётом доставки и
          отображается перед подтверждением оплаты.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="4. Доставка">
        <p>
          Условия и сроки доставки определяются разделом «Доставка» на сайте.
          Риск случайной гибели или повреждения товара переходит к Покупателю с
          момента передачи заказа службе доставки.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="5. Возврат и обмен">
        <p>
          Возврат и обмен товара осуществляются в порядке, предусмотренном
          законодательством РФ и разделом «Отмена» на сайте.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="6. Реквизиты продавца">
        <p>
          Продавец: {SELLER.legalName}
          <br />
          ИНН: {SELLER.inn} · {formatSellerOgrnip()}
          <br />
          Юридический адрес: {SELLER.address}
          <br />
          {formatBankDetails()}
          <br />
          Email: {SELLER.email} · Телефон: {formatSellerPhone()}
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
