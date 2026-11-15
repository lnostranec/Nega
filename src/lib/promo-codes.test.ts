import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPromoNotUsedByCustomer } from "./promo-codes";

type FakeOrder = { findFirst: (args: unknown) => Promise<{ id: string } | null> };

function client(result: { id: string } | null, calls: unknown[] = []) {
  return {
    order: {
      async findFirst(args: unknown) {
        calls.push(args);
        return result;
      },
    },
  } as unknown as Parameters<typeof assertPromoNotUsedByCustomer>[0];
}

test("промокод можно применить, если оплаченных заказов с ним нет", async () => {
  await assert.doesNotReject(
    assertPromoNotUsedByCustomer(client(null), "promo1", {
      userId: "user1",
      email: "a@b.ru",
    }),
  );
});

test("повторное использование после оплаты запрещено", async () => {
  await assert.rejects(
    assertPromoNotUsedByCustomer(client({ id: "order1" }), "promo1", {
      userId: "user1",
    }),
    /PROMO_ALREADY_USED/,
  );
});

test("без покупателя проверка не мешает", async () => {
  const calls: unknown[] = [];
  await assert.doesNotReject(
    assertPromoNotUsedByCustomer(client({ id: "order1" }, calls), "promo1", {}),
  );
  assert.equal(calls.length, 0);
});
