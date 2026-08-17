import { InfoPage } from "@/components/info/InfoPage";

export const metadata = { title: "Как снять мерки" };

export default function MeasurementsPage() {
  return (
    <InfoPage title="Как снять мерки">
      <p>
        Правильные мерки помогают выбрать комфортный размер. Измеряйтесь без
        одежды или в тонком белье, ленту держите горизонтально и без сильного
        натяжения.
      </p>

      <InfoPage.Section title="Объём под грудью">
        <p>
          Ленту проложите прямо под грудью, параллельно полу. Сделайте спокойный
          вдох и зафиксируйте значение в сантиметрах.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Объём груди">
        <p>
          Измерьте самую выступающую точку груди. Лента должна лежать ровно, не
          сжимая тело.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Калькулятор размера">
        <p>
          После снятия мерок откройте калькулятор размера в шапке сайта — он
          подскажет подходящий размер по введённым параметрам.
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
