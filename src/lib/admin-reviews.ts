import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { authorDisplayName } from "@/lib/reviews";

export type AdminReviewView = {
  id: string;
  rating: number;
  text: string;
  isActive: boolean;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  verified: boolean;
};

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export async function listAdminReviews(): Promise<AdminReviewView[]> {
  const prisma = getPrisma();

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  const userIds = [...new Set(reviews.map((review) => review.userId))];
  const buyers = userIds.length
    ? await prisma.order.findMany({
        where: { userId: { in: userIds }, status: { in: [...PAID_STATUSES] } },
        select: { userId: true },
        distinct: ["userId"],
      })
    : [];
  const verifiedIds = new Set(buyers.map((row) => row.userId).filter(Boolean) as string[]);

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    text: review.text,
    isActive: review.isActive,
    createdAt: review.createdAt.toISOString(),
    authorName: authorDisplayName(review.user),
    authorEmail: review.user.email,
    verified: verifiedIds.has(review.userId),
  }));
}

export async function setAdminReviewActive(
  id: string,
  isActive: boolean,
  adminId?: string | null,
): Promise<void> {
  await getPrisma().review.update({ where: { id }, data: { isActive } });

  await writeAuditLog({
    adminId,
    action: isActive ? "review_publish" : "review_hide",
    entityType: "Review",
    entityId: id,
  });
}

export async function deleteAdminReview(
  id: string,
  adminId?: string | null,
): Promise<void> {
  await getPrisma().review.delete({ where: { id } });

  await writeAuditLog({
    adminId,
    action: "review_delete",
    entityType: "Review",
    entityId: id,
  });
}
