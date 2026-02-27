import type { SharePrice, SharePriceSource } from "./share-price-source.js";

const MOCK_DATA: Record<string, SharePrice> = {
  NPN: {
    ticker: "NPN",
    price: 325080,
    change: 1250,
    changePercent: 0.39,
    volume: 1_542_300,
    currency: "ZAc",
    asOf: new Date().toISOString(),
  },
  SOL: {
    ticker: "SOL",
    price: 18945,
    change: -320,
    changePercent: -1.66,
    volume: 823_100,
    currency: "ZAc",
    asOf: new Date().toISOString(),
  },
  AGL: {
    ticker: "AGL",
    price: 54200,
    change: 780,
    changePercent: 1.46,
    volume: 2_105_400,
    currency: "ZAc",
    asOf: new Date().toISOString(),
  },
};

export class MockSharePriceSource implements SharePriceSource {
  async getPrice(ticker: string): Promise<SharePrice> {
    const upper = ticker.toUpperCase();
    const data = MOCK_DATA[upper];
    if (!data) {
      throw new Error(`Unknown ticker: ${upper}`);
    }
    return { ...data, asOf: new Date().toISOString() };
  }
}
