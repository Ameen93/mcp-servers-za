import { fetchWithRetry } from "./fetch-utils.js";

export interface StitchClientConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
  graphqlUrl?: string;
  scopes?: string[];
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: { code?: string; reason?: string };
  }>;
}

export class StitchClient {
  private config: Required<StitchClientConfig>;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: StitchClientConfig) {
    this.config = {
      tokenUrl: "https://secure.stitch.money/connect/token",
      graphqlUrl: "https://api.stitch.money/graphql",
      scopes: [
        "client_paymentrequest",
        "client_refund",
      ],
      ...config,
    };
  }

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 30_000) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      audience: this.config.tokenUrl,
      scope: this.config.scopes.join(" "),
    });

    const response = await fetchWithRetry(
      this.config.tokenUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
      { maxRetries: 2 }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new StitchAuthError(
        `Token request failed (${response.status}): ${text}`
      );
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  async query<T = unknown>(
    gql: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.getToken();

    const response = await fetchWithRetry(
      this.config.graphqlUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: gql, variables }),
      },
      { maxRetries: 2 }
    );

    if (!response.ok) {
      if (response.status === 401) {
        this.accessToken = null;
        throw new StitchAuthError(
          "Authentication failed. Check your STITCH_CLIENT_ID and STITCH_CLIENT_SECRET."
        );
      }
      const text = await response.text();
      throw new StitchApiError(
        `GraphQL request failed (${response.status}): ${text}`
      );
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors?.length) {
      const err = json.errors[0]!;
      const code = err.extensions?.code;
      if (code === "UNAUTHENTICATED" || code === "FORBIDDEN") {
        this.accessToken = null;
        throw new StitchAuthError(err.message);
      }
      throw new StitchApiError(
        err.message,
        code,
        err.extensions?.reason
      );
    }

    return json.data as T;
  }

  /** Force token invalidation (useful for testing) */
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }
}

export class StitchAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StitchAuthError";
  }
}

export class StitchApiError extends Error {
  code?: string;
  reason?: string;

  constructor(message: string, code?: string, reason?: string) {
    super(message);
    this.name = "StitchApiError";
    this.code = code;
    this.reason = reason;
  }
}
