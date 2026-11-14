import { InfoPage } from "@/components/info/InfoPage";
import { LegalBlocks } from "@/components/legal/LegalBlocks";
import { PRIVACY_SECTIONS } from "@/lib/legal/policies";

export const metadata = {
  title: "Политика в отношении обработки персональных данных",
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Политика в отношении обработки персональных данных">
      {PRIVACY_SECTIONS.map((section) => (
        <InfoPage.Section key={section.title} title={section.title}>
          <LegalBlocks blocks={section.blocks} />
        </InfoPage.Section>
      ))}
    </InfoPage>
  );
}
