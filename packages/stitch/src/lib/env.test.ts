import { requiredEnv, isoNow, ConfigError } from "./env.js";

describe("requiredEnv", () => {
  it("returns the value when set", () => {
    process.env.TEST_VAR_123 = "hello";
    expect(requiredEnv("TEST_VAR_123")).toBe("hello");
    delete process.env.TEST_VAR_123;
  });

  it("throws ConfigError when missing", () => {
    delete process.env.MISSING_VAR_XYZ;
    expect(() => requiredEnv("MISSING_VAR_XYZ")).toThrow(ConfigError);
    expect(() => requiredEnv("MISSING_VAR_XYZ")).toThrow("Missing required env var: MISSING_VAR_XYZ");
  });

  it("throws ConfigError when empty string", () => {
    process.env.EMPTY_VAR = "";
    expect(() => requiredEnv("EMPTY_VAR")).toThrow(ConfigError);
    delete process.env.EMPTY_VAR;
  });
});

describe("isoNow", () => {
  it("returns a valid ISO 8601 string", () => {
    const result = isoNow();
    expect(new Date(result).toISOString()).toBe(result);
  });
});
