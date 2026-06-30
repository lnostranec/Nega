import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function resetPrismaClient(): void {
  const existing = globalForPrisma.prisma;
  if (existing) {
    void existing.$disconnect().catch(() => {});
  }
  globalForPrisma.prisma = undefined;
}

export function getPrisma(): PrismaClient {
  if (!isDbConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = globalForPrisma.prisma;
  if (client && !("promoCode" in client)) {
    resetPrismaClient();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/** @deprecated Используйте getPrisma() после проверки isDbConfigured() */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});
