import { GiftCertificateContent } from "@/components/gift-certificate/GiftCertificateContent";
import { getGiftCertificateConfig } from "@/lib/gift-certificate-settings";

export const metadata = { title: "Подарочный сертификат" };

export const dynamic = "force-dynamic";

export default async function GiftCertificatePage() {
  const config = await getGiftCertificateConfig();
  return <GiftCertificateContent config={config} />;
}
