import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-2xl font-medium">Настройки</h1>
      <p className="mt-2 text-sm text-stone-500">
        Общие настройки магазина и программы лояльности
      </p>
      <div className="mt-8">
        <AdminSettingsForm
          initial={{
            shopName: settings?.shopName ?? "Nega",
            pointsPercent: settings?.pointsPercent ?? 5,
            minOrderForPoints: settings?.minOrderForPoints ?? 0,
          }}
        />
      </div>
    </div>
  );
}
