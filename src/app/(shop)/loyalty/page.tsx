import { InfoPage } from "@/components/info/InfoPage";

export const metadata = { title: "Программа лояльности" };

export default function LoyaltyPage() {
  return (
    <InfoPage title="Программа лояльности">
      <p>
        За покупки в Nega начисляются баллы. Их можно списывать при следующих
        заказах и получать дополнительную выгоду.
      </p>

      <InfoPage.Section title="Как работает">
        <p>
          Баллы начисляются после оплаты заказа. Процент начисления и правила
          списания отображаются в личном кабинете и на странице оформления
          заказа.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Где посмотреть баланс">
        <p>
          Войдите в личный кабинет — там доступны текущий баланс и история
          начислений и списаний.
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
