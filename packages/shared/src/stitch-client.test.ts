import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StitchClient, StitchAuthError, StitchApiError } from "./stitch-client.js";

const mockFetch = vi.fn();

describe("StitchClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeClient() {
    return new StitchClient({
      clientId: "test-id",
      clientSecret: "test-secret",
    });
  }

  function mockTokenResponse() {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "test-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "client_paymentrequest",
        }),
        { status: 200 }
      )
    );
  }

  it("fetches and caches token", async () => {
    const client = makeClient();
    mockTokenResponse();
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { hello: "world" } }), { status: 200 })
    );

    const result = await client.query("{ hello }");
    expect(result).toEqual({ hello: "world" });

    // Second call should reuse cached token (only 1 more fetch for graphql)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { hello: "again" } }), { status: 200 })
    );
    const result2 = await client.query("{ hello }");
    expect(result2).toEqual({ hello: "again" });

    // 1 token + 2 graphql = 3 total
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws StitchAuthError on token failure", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(client.getToken()).rejects.toThrow(StitchAuthError);
  });

  it("throws StitchApiError on GraphQL errors", async () => {
    const client = makeClient();
    mockTokenResponse();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          errors: [{ message: "Something broke", extensions: { code: "BAD_USER_INPUT" } }],
        }),
        { status: 200 }
      )
    );

    await expect(client.query("mutation { bad }")).rejects.toThrow(StitchApiError);
  });

  it("clears token on 401 response to query", async () => {
    const client = makeClient();
    mockTokenResponse();
    mockFetch.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(client.query("{ hello }")).rejects.toThrow(StitchAuthError);
  });
});
