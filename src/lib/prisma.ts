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

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "10");
    }
    // Подключение идёт через пулер Yandex (порт 6432): ограничиваем число
    // соединений и просим Prisma не использовать prepared statements.
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    if (!parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Пулер Yandex закрывает простаивающие соединения, а в serverless функция
 * засыпает и просыпается с мёртвым сокетом — Prisma отдаёт P1017
 * «Server has closed the connection». Повторяем такие операции.
 */
const TRANSIENT_DB_ERRORS = [
  "Server has closed the connection",
  "Connection terminated unexpectedly",
  "Timed out fetching a new connection",
  "ECONNRESET",
  "P1017",
  "P1001",
  "P1008",
];

export function isTransientDbError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_DB_ERRORS.some((needle) => message.includes(needle));
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts) throw error;

      console.warn(
        `[db] транзиентная ошибка, повтор ${attempt}/${attempts - 1}:`,
        error instanceof Error ? error.message.split("\n")[0] : error,
      );
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }

  throw lastError;
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
