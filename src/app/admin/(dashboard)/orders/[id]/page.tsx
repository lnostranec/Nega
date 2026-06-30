import { notFound } from "next/navigation";
import { AdminOrderDetailPanel } from "@/components/admin/AdminOrderDetailPanel";
import { getAdminOrder } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return <AdminOrderDetailPanel order={order} />;
}
