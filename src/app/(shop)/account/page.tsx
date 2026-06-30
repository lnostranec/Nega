import { Suspense } from "react";
import { AccountAuthOpener } from "@/components/account/AccountAuthOpener";
import { AccountPageContent } from "@/components/account/AccountPageContent";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { getSessionUser, toPublicUser } from "@/lib/auth";
import { getUserOrders, type OrderView } from "@/lib/orders";
import { getUserPointTransactions, type PointTransactionView } from "@/lib/points-history";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

export const metadata = {
  title: "Личный кабинет",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();

  let orders: OrderView[] = [];
  let pointTransactions: PointTransactionView[] = [];
  if (user && isDbConfigured()) {
    [orders, pointTransactions] = await Promise.all([
      getUserOrders(user.id),
      getUserPointTransactions(user.id),
    ]);
  }

  const serverUser = user ? toPublicUser(user) : null;

  return (
    <SiteContainer className="py-10">
      <Suspense fallback={null}>
        <AccountAuthOpener />
      </Suspense>
      <AccountPageContent
        serverUser={serverUser}
        orders={orders}
        pointTransactions={pointTransactions}
      />
    </SiteContainer>
  );
}
