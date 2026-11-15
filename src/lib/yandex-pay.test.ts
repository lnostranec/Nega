import assert from "node:assert/strict";
import { test } from "node:test";
import { fitCartToAmount } from "./yandex-pay";

type Item = ReturnType<typeof fitCartToAmount>[number];

function item(price: number, count = 1): Item {
  return {
    productId: "p",
    title: "Товар",
    quantity: { count: String(count) },
    total: (price * count).toFixed(2),
    unitPrice: price.toFixed(2),
  };
}

function sum(items: Item[]): number {
  return Number(
    items
      .reduce((acc, current) => acc + Number(current.total), 0)
      .toFixed(2),
  );
}

test("без скидки позиции не меняются", () => {
  const items = [item(100), item(350)];
  const result = fitCartToAmount(items, 450);

  assert.equal(sum(result), 450);
  assert.equal(result[0].total, "100.00");
});

test("скидка баллами распределяется по позициям", () => {
  const items = [item(105)];
  const result = fitCartToAmount(items, 100);

  assert.equal(sum(result), 100);
  assert.equal(result[0].total, "100.00");
  assert.equal(result[0].unitPrice, "100.00");
});

test("позиции с количеством сохраняют цену за штуку", () => {
  const items = [item(50, 2), item(5)];
  const result = fitCartToAmount(items, 95);

  assert.equal(sum(result), 95);
  for (const line of result) {
    const count = Number(line.quantity.count);
    assert.equal(
      Number(line.unitPrice) * count,
      Number(line.total),
      "unitPrice * count должен равняться total",
    );
  }
});

test("промокод и баллы вместе — сумма позиций равна итогу", () => {
  // товар 105 + доставка 350 = 455; промокод 10 и баллы 5 → итог 440
  const items = [item(105), item(350)];
  const result = fitCartToAmount(items, 440);

  assert.equal(sum(result), 440);
});

test("нулевой итог не ломает расчёт", () => {
  const items = [item(100)];
  const result = fitCartToAmount(items, 0);

  assert.equal(sum(result), 0);
});
