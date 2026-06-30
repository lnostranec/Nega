"use client";

import type { PublicUser } from "@/lib/auth-types";
import type { OrderView } from "@/lib/orders";
import type { PointTransactionView } from "@/lib/points-history";
import { useAuth } from "./AuthModalProvider";
import { AccountDashboard, AccountGuest } from "./AccountDashboard";

type Props = {
  serverUser: PublicUser | null;
  orders: OrderView[];
  pointTransactions: PointTransactionView[];
};

export function AccountPageContent({
  serverUser,
  orders,
  pointTransactions,
}: Props) {
  const { user: clientUser, loading } = useAuth();
  const user = serverUser ?? clientUser;

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-stone-500">
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <AccountGuest />;
  }

  const displayUser =
    serverUser && clientUser && serverUser.points !== clientUser.points
      ? { ...user, points: Math.max(serverUser.points, clientUser.points) }
      : user;

  return (
    <AccountDashboard
      user={displayUser}
      orders={orders}
      pointTransactions={pointTransactions}
    />
  );
}
