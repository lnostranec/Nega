import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildOrderResultUrl,
  createOrderToken,
  isOrderTokenEnabled,
  verifyOrderToken,
} from "./order-token";

const KEYS = ["ORDER_TOKEN_SECRET", "CRON_SECRET"] as const;

function reset() {
  for (const key of KEYS) delete process.env[key];
}

test("без секрета подпись не создаётся", () => {
  reset();
  assert.equal(isOrderTokenEnabled(), false);
  assert.equal(createOrderToken("order1"), null);
  assert.equal(verifyOrderToken("order1", null), false);
});

test("подпись детерминирована и проверяется", () => {
  reset();
  process.env.ORDER_TOKEN_SECRET = "secret";

  const token = createOrderToken("order1");
  assert.ok(token);
  assert.equal(token.length, 32);
  assert.equal(token, createOrderToken("order1"));
  assert.equal(verifyOrderToken("order1", token), true);

  reset();
});

test("чужой заказ, подделка и мусор отклоняются", () => {
  reset();
  process.env.ORDER_TOKEN_SECRET = "secret";

  const token = createOrderToken("order1")!;
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

  assert.equal(verifyOrderToken("order2", token), false);
  assert.equal(verifyOrderToken("order1", tampered), false);
  assert.equal(verifyOrderToken("order1", "short"), false);

  reset();
});

test("CRON_SECRET работает как запасной секрет", () => {
  reset();
  process.env.CRON_SECRET = "cron-secret";

  assert.equal(isOrderTokenEnabled(), true);
  assert.ok(createOrderToken("order1"));

  reset();
});

test("buildOrderResultUrl добавляет подпись к ссылке", () => {
  reset();
  process.env.ORDER_TOKEN_SECRET = "secret";

  const url = buildOrderResultUrl("https://example.com/", "order1");
  assert.match(
    url,
    /^https:\/\/example\.com\/checkout\/result\?orderId=order1&token=[0-9a-f]{32}$/,
  );

  reset();
});
