import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma } from "@prisma/client";
import { reserveOrderStock } from "./stock";

type Call = { id: string; decrement: number };

function fakeTx(available: Record<string, number>) {
  const calls: Call[] = [];

  const tx = {
    productVariant: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; stock?: { gte: number } };
        data: { stock: { decrement: number } };
      }) => {
        const needed = data.stock.decrement;
        const have = available[where.id] ?? 0;
        calls.push({ id: where.id, decrement: needed });

        if (have < needed) return { count: 0 };

        available[where.id] = have - needed;
        return { count: 1 };
      },
    },
  } as unknown as Prisma.TransactionClient;

  return { tx, calls, available };
}

test("reserveOrderStock списывает остаток по обычному варианту", async () => {
  const { tx, calls } = fakeTx({ v1: 5 });

  const missing = await reserveOrderStock(tx, [
    { variantId: "v1", quantity: 2 },
  ]);

  assert.deepEqual(missing, []);
  assert.deepEqual(calls, [{ id: "v1", decrement: 2 }]);
});

test("reserveOrderStock суммирует одинаковые варианты", async () => {
  const { tx, calls } = fakeTx({ v1: 5 });

  await reserveOrderStock(tx, [
    { variantId: "v1", quantity: 2 },
    { variantId: "v1", quantity: 1 },
  ]);

  assert.deepEqual(calls, [{ id: "v1", decrement: 3 }]);
});

test("reserveOrderStock возвращает варианты, которых не хватило", async () => {
  const { tx } = fakeTx({ v1: 1, v2: 10 });

  const missing = await reserveOrderStock(tx, [
    { variantId: "v1", quantity: 3 },
    { variantId: "v2", quantity: 1 },
  ]);

  assert.deepEqual(missing, ["v1"]);
});

test("reserveOrderStock раскладывает комплект на верх и низ", async () => {
  const { tx, calls } = fakeTx({ top: 4, bottom: 4 });

  await reserveOrderStock(tx, [
    { variantId: "set:top:bottom:%D0%9A%D0%BB%D0%B0%D1%81%D1%81", quantity: 2 },
  ]);

  assert.deepEqual(calls, [
    { id: "top", decrement: 2 },
    { id: "bottom", decrement: 2 },
  ]);
});

test("reserveOrderStock пропускает допы и подарочные сертификаты", async () => {
  const { tx, calls } = fakeTx({});

  await reserveOrderStock(tx, [
    { variantId: "addon:abc", quantity: 1 },
    { variantId: "gift-1-3000-electronic", quantity: 1 },
    { variantId: null, sourceVariantId: "gift-1-3000-electronic", quantity: 1 },
  ]);

  assert.deepEqual(calls, []);
});
