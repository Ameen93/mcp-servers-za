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

export function isoNow(): string {
  return new Date().toISOString();
}
