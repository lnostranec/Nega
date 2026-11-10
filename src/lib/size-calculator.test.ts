import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BAND_RANGES,
  BUST_RANGES_BY_BAND,
  calculateBraSize,
  calculatePantySize,
  CUPS_BY_BAND,
  getBustRange,
} from "./size-calculator";

describe("BUST_RANGES_BY_BAND", () => {
  const bands = BAND_RANGES.map((row) => row.band);

  it("описывает только существующие пояса и чашки", () => {
    for (const [band, cups] of Object.entries(BUST_RANGES_BY_BAND)) {
      const bandNumber = Number(band);
      assert.ok(bands.includes(bandNumber), `неизвестный пояс ${band}`);

      for (const cup of Object.keys(cups)) {
        assert.ok(
          CUPS_BY_BAND[bandNumber]?.includes(cup),
          `чашка ${cup} не предусмотрена для пояса ${band}`,
        );
      }
    }
  });

  it("диапазоны корректны: нижняя граница меньше верхней и выше пояса", () => {
    for (const [band, cups] of Object.entries(BUST_RANGES_BY_BAND)) {
      const bandNumber = Number(band);

      for (const [cup, value] of Object.entries(cups)) {
        const match = value.match(/^(\d+)–(\d+)$/);
        assert.ok(match, `некорректный диапазон ${band}${cup}: ${value}`);

        const min = Number(match[1]);
        const max = Number(match[2]);
        assert.ok(min < max, `${band}${cup}: ${min} не меньше ${max}`);
        assert.ok(min > bandNumber, `${band}${cup}: обхват ниже пояса`);
      }
    }
  });

  it("getBustRange отдаёт диапазон и null для неизвестных пар", () => {
    assert.equal(getBustRange(70, "C"), "86–88");
    assert.equal(getBustRange(65, "A"), "77–79");
    assert.equal(getBustRange(75, "D"), "93–95");
    assert.equal(getBustRange(100, "A"), null);
  });

  it("диапазон есть у каждой разрешённой чашки", () => {
    for (const [band, cupList] of Object.entries(CUPS_BY_BAND)) {
      for (const cup of cupList) {
        assert.ok(
          getBustRange(Number(band), cup),
          `нет диапазона для ${band}${cup}`,
        );
      }
    }
  });
});

describe("calculateBraSize", () => {
  it("maps underbust to the nearest 5 cm band", () => {
    assert.equal(calculateBraSize(75, 90)?.size, "75B");
    assert.equal(calculateBraSize(70, 82)?.size, "70A");
  });

  it("считает чашку от номинала пояса, как в таблице заказчицы", () => {
    // 91 при поясе 75 → смещение 16 → C (таблица: 75C = 91–93)
    assert.equal(calculateBraSize(77, 91)?.size, "75C");
    assert.equal(calculateBraSize(77, 88)?.size, "75A");
    assert.equal(calculateBraSize(70, 80)?.size, "70AA");
    assert.equal(calculateBraSize(80, 96)?.size, "80C");
    assert.equal(calculateBraSize(90, 106)?.size, "90C");
    assert.equal(calculateBraSize(95, 111)?.size, "95C");
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
