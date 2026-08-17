import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { _resetRateLimitBuckets, rateLimit } from "./rate-limit";
import { isYooKassaIp } from "./yookassa";

describe("rateLimit", () => {
  beforeEach(() => {
    _resetRateLimitBuckets();
  });

  it("allows requests under the limit", () => {
    const a = rateLimit("t1", 2, 60_000);
    const b = rateLimit("t1", 2, 60_000);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
  });

  it("blocks when limit exceeded", () => {
    rateLimit("t2", 1, 60_000);
    const blocked = rateLimit("t2", 1, 60_000);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterSec >= 1);
  });
});

describe("isYooKassaIp", () => {
  it("accepts known ranges", () => {
    assert.equal(isYooKassaIp("185.71.76.1"), true);
    assert.equal(isYooKassaIp("77.75.156.11"), true);
  });

  it("rejects foreign IPs", () => {
    assert.equal(isYooKassaIp("8.8.8.8"), false);
    assert.equal(isYooKassaIp(null), false);
  });
});
