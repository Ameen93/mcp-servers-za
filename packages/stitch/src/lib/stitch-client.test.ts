import { StitchClient, StitchAuthError, StitchApiError } from "./stitch-client.js";

describe("StitchClient", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function makeClient() {
    return new StitchClient({
      clientId: "test-id",
      clientSecret: "test-secret",
    });
  }

  function mockTokenResponse(token = "tok_123", expiresIn = 3600) {
    return new Response(JSON.stringify({ access_token: token, expires_in: expiresIn }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("fetches a token and makes a GraphQL query", async () => {
    const client = makeClient();

    mockFetch
      .mockResolvedValueOnce(mockTokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { node: { id: "123" } } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await client.query("query { node(id: $id) { id } }", { id: "123" });
    expect(result).toEqual({ node: { id: "123" } });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("reuses cached token on second call", async () => {
    const client = makeClient();

    mockFetch
      .mockResolvedValueOnce(mockTokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { a: 1 } }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { b: 2 } }), { status: 200 })
      );

    await client.query("q1");
    await client.query("q2");

    // Token fetched once, GraphQL called twice = 3 total
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws StitchAuthError on token failure", async () => {
    const client = makeClient();

    mockFetch.mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(client.getToken()).rejects.toThrow(StitchAuthError);
  });

  it("throws StitchAuthError on 401 GraphQL response", async () => {
    const client = makeClient();

    mockFetch
      .mockResolvedValueOnce(mockTokenResponse())
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

    await expect(client.query("q")).rejects.toThrow(StitchAuthError);
  });

  it("throws StitchApiError on GraphQL errors", async () => {
    const client = makeClient();

    mockFetch
      .mockResolvedValueOnce(mockTokenResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errors: [{ message: "Bad input", extensions: { code: "BAD_REQUEST" } }],
          }),
          { status: 200 }
        )
      );

    await expect(client.query("q")).rejects.toThrow(StitchApiError);
  });
});
