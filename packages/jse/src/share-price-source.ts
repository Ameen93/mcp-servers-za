/** Represents a single share price snapshot. */
export interface SharePrice {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  currency: string;
  asOf: string;
}

/** Abstraction over any share price data provider. */
export interface SharePriceSource {
  /** Fetch the latest price for a JSE ticker. Throws on unknown ticker or source error. */
  getPrice(ticker: string): Promise<SharePrice>;
}
