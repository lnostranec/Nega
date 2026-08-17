import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbAvailability: { ok: boolean; at: number } | undefined;
};

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL!.trim();
  if (/[?&]connect_timeout=/.test(url)) return url;
  return url.includes("?")
    ? `${url}&connect_timeout=5`
    : `${url}?connect_timeout=5`;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Short-lived ping so shop pages can fall back to demo data if the host is down. */
export async function isDbAvailable(): Promise<boolean> {
  if (!isDbConfigured()) return false;

  const now = Date.now();
  const cached = globalForPrisma.dbAvailability;
  const ttlMs = cached?.ok ? 30_000 : 10_000;
  if (cached && now - cached.at < ttlMs) return cached.ok;

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    globalForPrisma.dbAvailability = { ok: true, at: now };
    return true;
  } catch {
    globalForPrisma.dbAvailability = { ok: false, at: now };
    return false;
  }
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
