import { AdminGiftCertificateForm } from "@/components/admin/AdminGiftCertificateForm";
import { getGiftCertificateConfig } from "@/lib/gift-certificate-settings";

export const dynamic = "force-dynamic";

export default async function AdminGiftCertificatePage() {
  const config = await getGiftCertificateConfig();

  return (
    <div>
      <h1 className="text-2xl font-medium">Подарочный сертификат</h1>
      <p className="mt-2 text-sm text-stone-500">
        Фото, дизайны, номиналы, типы и тексты страницы{" "}
        <a href="/gift-certificate" className="underline" target="_blank" rel="noopener noreferrer">
          «Подарочный сертификат»
        </a>
        . Изменения видны на сайте сразу после сохранения. Уже оформленные заказы
        и выданные коды не меняются.
      </p>
      <div className="mt-6">
        <AdminGiftCertificateForm initial={config} />
      </div>
    </div>
  );
}
