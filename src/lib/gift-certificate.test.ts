import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGiftCertificateVariantId,
  DEFAULT_GIFT_CERTIFICATE_CONFIG,
  isGiftCertificateVariantAvailable,
  parseGiftCertificateVariant,
} from "./gift-certificate";
import {
  GiftCertificateSettingsError,
  normalizeGiftCertificateConfig,
} from "./gift-certificate-settings";

describe("parseGiftCertificateVariant", () => {
  it("round-trips a built variant id", () => {
    const id = buildGiftCertificateVariantId("a1b2", 5000, "paper");
    assert.deepEqual(parseGiftCertificateVariant(id), {
      designId: "a1b2",
      nominal: 5000,
      typeId: "paper",
    });
  });

  it("rejects malformed ids", () => {
    assert.equal(parseGiftCertificateVariant("gift-1-abc-paper"), null);
    assert.equal(parseGiftCertificateVariant("gift-1-5000"), null);
    assert.equal(parseGiftCertificateVariant("gift-1-5000-paper-x"), null);
    assert.equal(parseGiftCertificateVariant("variant-1-5000-paper"), null);
  });
});

describe("isGiftCertificateVariantAvailable", () => {
  const config = DEFAULT_GIFT_CERTIFICATE_CONFIG;

  it("accepts configured design, nominal and type", () => {
    assert.ok(isGiftCertificateVariantAvailable("gift-2-5000-electronic", config));
  });

  it("rejects values missing from the config", () => {
    assert.equal(isGiftCertificateVariantAvailable("gift-2-1-electronic", config), false);
    assert.equal(isGiftCertificateVariantAvailable("gift-9-5000-electronic", config), false);
    assert.equal(isGiftCertificateVariantAvailable("gift-2-5000-plastic", config), false);
  });
});

describe("normalizeGiftCertificateConfig", () => {
  const valid = {
    mainImageUrl: "/uploads/products/a.jpg",
    description: "  Описание  ",
    deliveryText: "",
    designs: [{ id: "1", name: " Розовый ", imageUrl: "https://evil.example/x.png" }],
    nominals: [5000, 3000, 5000],
    types: [{ id: "bad-id!", label: "Электронный" }],
  };

  it("trims text, dedupes and sorts nominals, drops foreign images", () => {
    const config = normalizeGiftCertificateConfig(valid);
    assert.equal(config.description, "Описание");
    assert.deepEqual(config.nominals, [3000, 5000]);
    assert.equal(config.designs[0].name, "Розовый");
    assert.equal(config.designs[0].imageUrl, null);
    assert.equal(config.mainImageUrl, "/uploads/products/a.jpg");
  });

  it("replaces ids that would break the variant id", () => {
    const config = normalizeGiftCertificateConfig(valid);
    assert.match(config.types[0].id, /^[a-z0-9]+$/i);
  });

  it("requires at least one design, nominal and type", () => {
    assert.throws(
      () => normalizeGiftCertificateConfig({ ...valid, designs: [] }),
      GiftCertificateSettingsError,
    );
    assert.throws(
      () => normalizeGiftCertificateConfig({ ...valid, nominals: [] }),
      GiftCertificateSettingsError,
    );
    assert.throws(
      () => normalizeGiftCertificateConfig({ ...valid, types: [] }),
      GiftCertificateSettingsError,
    );
  });

  it("rejects bad nominals and empty names", () => {
    assert.throws(
      () => normalizeGiftCertificateConfig({ ...valid, nominals: [99.5] }),
      GiftCertificateSettingsError,
    );
    assert.throws(
      () =>
        normalizeGiftCertificateConfig({
          ...valid,
          designs: [{ id: "1", name: "  ", imageUrl: null }],
        }),
      GiftCertificateSettingsError,
    );
  });
});
