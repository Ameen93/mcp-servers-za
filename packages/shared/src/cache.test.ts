import { describe, it, expect, vi } from "vitest";
import { Cache } from "./cache.js";

describe("Cache", () => {
  it("stores and retrieves values", () => {
    const cache = new Cache(60_000);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("returns undefined for missing keys", () => {
    const cache = new Cache();
    expect(cache.get("nope")).toBeUndefined();
  });

  it("expires entries after TTL", () => {
    const cache = new Cache(100);
    cache.set("key", "value");
    vi.useFakeTimers();
    vi.advanceTimersByTime(150);
    expect(cache.get("key")).toBeUndefined();
    vi.useRealTimers();
  });

  it("supports custom TTL per entry", () => {
    const cache = new Cache(60_000);
    cache.set("short", "val", 50);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    expect(cache.get("short")).toBeUndefined();
    vi.useRealTimers();
  });

  it("delete removes entry", () => {
    const cache = new Cache();
    cache.set("key", "val");
    cache.delete("key");
    expect(cache.get("key")).toBeUndefined();
  });

  it("clear removes all entries", () => {
    const cache = new Cache();
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });
});
