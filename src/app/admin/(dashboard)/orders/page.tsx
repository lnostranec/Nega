import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { listAdminOrders } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listAdminOrders();

  return (
    <div>
      <h1 className="text-2xl font-medium">Заказы</h1>
      <p className="mt-2 text-sm text-stone-500">
        Список заказов и смена статусов
      </p>
      <div className="mt-6">
        <AdminOrdersTable orders={orders} />
      </div>
    </div>
  );
}
