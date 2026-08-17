import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBraSize, calculatePantySize } from "./size-calculator";

describe("calculateBraSize", () => {
  it("maps underbust to the nearest 5 cm band", () => {
    assert.equal(calculateBraSize(75, 88)?.size, "75B");
    assert.equal(calculateBraSize(73, 88)?.size, "75C");
    assert.equal(calculateBraSize(70, 80)?.size, "70A");
  });

  it("returns null outside the grid", () => {
    assert.equal(calculateBraSize(60, 80), null);
    assert.equal(calculateBraSize(75, 76), null);
    assert.equal(calculateBraSize(95, 125), null);
  });
});

describe("calculatePantySize", () => {
  it("uses hips and waist independently", () => {
    assert.equal(calculatePantySize(68, 94)?.size, "S");
    assert.equal(calculatePantySize(70, 98)?.size, "M");
  });

  it("picks the larger size when they differ", () => {
    assert.equal(calculatePantySize(68, 100)?.size, "M");
  });

  it("returns null outside the grid", () => {
    assert.equal(calculatePantySize(40, 94), null);
    assert.equal(calculatePantySize(68, 140), null);
  });
});
