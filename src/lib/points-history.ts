import type { PointType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

export type PointTransactionView = {
  id: string;
  amount: number;
  type: PointType;
  label: string;
  note: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<PointType, string> = {
  EARNED: "Начисление",
  SPENT: "Списание",
  ADJUSTMENT: "Корректировка",
};

export async function getUserPointTransactions(
  userId: string,
  limit = 50,
): Promise<PointTransactionView[]> {
  const transactions = await getPrisma().pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions.map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    label: TYPE_LABELS[tx.type],
    note: tx.note,
    createdAt: tx.createdAt.toISOString(),
  }));
}
