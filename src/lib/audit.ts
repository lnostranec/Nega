import { getPrisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  adminId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await getPrisma().adminAuditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

export async function listAuditLogs(limit = 50) {
  return getPrisma().adminAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { email: true } },
    },
  });
}
