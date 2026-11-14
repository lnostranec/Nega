import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";
import { LegalBlocks } from "@/components/legal/LegalBlocks";
import { COOKIE_BLOCKS } from "@/lib/legal/policies";

export const metadata = { title: "Условия использования файлов cookie" };

export default function CookiesPage() {
  return (
    <InfoPage title="Условия использования файлов cookie">
      <LegalBlocks blocks={COOKIE_BLOCKS} />

      <InfoPage.Section title="Персональные данные">
        <p>
          Подробнее о том, как обрабатываются персональные данные, — в{" "}
          <Link
            href="/privacy"
            className="text-[#260402] underline underline-offset-2"
          >
            Политике в отношении обработки персональных данных
          </Link>
          .
        </p>
      </InfoPage.Section>
    </InfoPage>
  );
}
