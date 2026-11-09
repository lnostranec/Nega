import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectSizeSystem,
  mergeSizeOptions,
  normalizeNewSize,
} from "./admin-variant-matrix";

test("detectSizeSystem распознаёт пояса и буквы", () => {
  assert.equal(detectSizeSystem(["S", "M", "L"]), "letters");
  assert.equal(detectSizeSystem(["75B", "80C"]), "bra");
  assert.equal(detectSizeSystem(["70F", "S"]), "bra");
  assert.equal(detectSizeSystem([]), "letters");
});

test("mergeSizeOptions добавляет свои размеры в конец", () => {
  assert.deepEqual(
    mergeSizeOptions(["XS", "S", "M"], ["S", "65B", "4XL"]),
    ["XS", "S", "M", "65B", "4XL"],
  );
  assert.deepEqual(mergeSizeOptions(["S", "M"], []), ["S", "M"]);
});

test("normalizeNewSize приводит ввод к верхнему регистру и отсекает мусор", () => {
  assert.equal(normalizeNewSize(" 70f "), "70F");
  assert.equal(normalizeNewSize("4xl"), "4XL");
  assert.equal(normalizeNewSize(""), null);
  assert.equal(normalizeNewSize("   "), null);
  assert.equal(normalizeNewSize("70-B"), null);
  assert.equal(normalizeNewSize("оченьдлинный"), null);
});
