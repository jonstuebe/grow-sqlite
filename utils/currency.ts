import Decimal from "decimal.js";

/**
 * Convert cents (integer) to dollars (decimal)
 */
export function centsToDollars(cents: number): number {
  return new Decimal(cents).dividedBy(100).toNumber();
}

/**
 * Convert dollars (decimal) to cents (integer)
 */
export function dollarsToCents(dollars: number): number {
  return new Decimal(dollars).times(100).toNumber();
}

