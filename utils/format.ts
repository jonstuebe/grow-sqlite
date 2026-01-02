/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    trailingZeroDisplay: "stripIfInteger",
  }).format(amount);
}

/**
 * Calculate progress percentage (clamped 0-100)
 */
export function getProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.max((current / target) * 100, 0), 100);
}
