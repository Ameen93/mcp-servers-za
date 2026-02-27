export type JsonRecord = Record<string, unknown>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new ConfigError(`Missing required env var: ${name}`);
  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export { StitchClient, type StitchClientConfig } from "./stitch-client.js";
export { AlphaVantageClient, type AlphaVantageConfig } from "./alpha-vantage-client.js";
export { Cache } from "./cache.js";
export { RateLimiter } from "./rate-limiter.js";
export { fetchWithRetry, type FetchOptions } from "./fetch-utils.js";
