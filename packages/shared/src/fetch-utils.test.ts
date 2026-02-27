import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry } from "./fetch-utils.js";

const mockFetch = vi.fn();

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns response on success", async () => {
    mockFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const res = await fetchWithRetry("https://example.com");
    expect(res.status).toBe(200);
  });

  it("retries on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network fail"));
    mockFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const res = await fetchWithRetry("https://example.com", {}, {
      maxRetries: 1,
      baseDelayMs: 10,
    });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 429", async () => {
    mockFetch.mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    mockFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const res = await fetchWithRetry("https://example.com", {}, {
      maxRetries: 1,
      baseDelayMs: 10,
    });
    expect(res.status).toBe(200);
  });

  it("throws after exhausting retries", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));

    await expect(
      fetchWithRetry("https://example.com", {}, {
        maxRetries: 1,
        baseDelayMs: 10,
      })
    ).rejects.toThrow("fail");
  });
});
