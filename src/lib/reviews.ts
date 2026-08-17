import { getPrisma } from "@/lib/prisma";

export type ReviewView = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  authorName: string;
};

function authorDisplayName(user: {
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

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt.toISOString(),
    authorName: authorDisplayName(review.user),
  }));
}

export async function createReview(input: {
  userId: string;
  rating: number;
  text: string;
}): Promise<ReviewView> {
  const rating = Math.max(1, Math.min(5, Math.floor(input.rating)));
  const text = input.text.trim();
  if (!text) throw new Error("REVIEW_TEXT_EMPTY");
  if (text.length > 2000) throw new Error("REVIEW_TEXT_LONG");

  const review = await getPrisma().review.create({
    data: {
      userId: input.userId,
      rating,
      text,
      isActive: true,
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
  };
}
