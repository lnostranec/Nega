import { getPrisma } from "@/lib/prisma";

export type ReviewView = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  authorName: string;
  /** Есть ли у автора оплаченный заказ */
  verified: boolean;
};

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export function authorDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first} ${last[0]}.`;
  if (first) return first;
  return user.email.split("@")[0] || "Покупатель";
}

/** Пользователи, у которых есть оплаченный или доставленный заказ. */
async function buyersAmong(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const rows = await getPrisma().order.findMany({
    where: {
      userId: { in: userIds },
      status: { in: [...PAID_STATUSES] },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return new Set(rows.map((row) => row.userId).filter(Boolean) as string[]);
}

export async function listActiveReviews(limit = 100): Promise<ReviewView[]> {
  const reviews = await getPrisma().review.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  const verified = await buyersAmong([...new Set(reviews.map((r) => r.userId))]);

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt.toISOString(),
    authorName: authorDisplayName(review.user),
    verified: verified.has(review.userId),
  }));
}

/**
 * Новый отзыв создаётся скрытым: на сайт он попадёт только после модерации
 * в админке. Один отзыв в сутки с аккаунта.
 */
export async function createReview(input: {
  userId: string;
  rating: number;
  text: string;
}): Promise<ReviewView> {
  const rating = Math.max(1, Math.min(5, Math.floor(input.rating)));
  const text = input.text.trim();
  if (!text) throw new Error("REVIEW_TEXT_EMPTY");
  if (text.length > 2000) throw new Error("REVIEW_TEXT_LONG");

  const prisma = getPrisma();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await prisma.review.findFirst({
    where: { userId: input.userId, createdAt: { gte: since } },
    select: { id: true },
  });
  if (recent) throw new Error("REVIEW_TOO_OFTEN");

  const review = await prisma.review.create({
    data: {
      userId: input.userId,
      rating,
      text,
      isActive: false,
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  return {
    id: review.id,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt.toISOString(),
    authorName: authorDisplayName(review.user),
    verified: false,
  };
}
