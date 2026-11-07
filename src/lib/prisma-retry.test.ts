import assert from "node:assert/strict";
import { test } from "node:test";
import { isTransientDbError, withDbRetry } from "./prisma";

test("isTransientDbError распознаёт обрыв соединения", () => {
  assert.equal(
    isTransientDbError(new Error("Server has closed the connection.")),
    true,
  );
  assert.equal(
    isTransientDbError(
      new Error("Connection terminated unexpectedly"),
    ),
    true,
  );
  assert.equal(
    isTransientDbError(new Error("Invalid `prisma.order.findMany()` invocation")),
    false,
  );
});

test("withDbRetry повторяет транзиентную ошибку", async () => {
  let calls = 0;

  const result = await withDbRetry(async () => {
    calls += 1;
    if (calls === 1) throw new Error("Server has closed the connection.");
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(calls, 2);
});

test("withDbRetry не повторяет обычную ошибку", async () => {
  let calls = 0;

  await assert.rejects(async () => {
    await withDbRetry(async () => {
      calls += 1;
      throw new Error("ORDER_NOT_FOUND");
    });
  });

  assert.equal(calls, 1);
});

test("withDbRetry сдаётся после всех попыток", async () => {
  let calls = 0;

  await assert.rejects(
    withDbRetry(async () => {
      calls += 1;
      throw new Error("P1017");
    }, 2),
  );

  assert.equal(calls, 2);
});
