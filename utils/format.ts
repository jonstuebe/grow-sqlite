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
 * Calculate progress percentage
 */
export function getProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max((current / target) * 100, 0);
}

/**
 * Format sync result message
 * Handles edge cases for better UX:
 * - No changes: "Already in sync"
 * - Only accounts: "Synced 2 accounts"
 * - Only transactions: "Synced 3 transactions"
 * - Both: "Synced 2 accounts and 3 transactions"
 */
export function formatSyncResult(
  accountsMerged: number,
  transactionsMerged: number
): string {
  const hasAccounts = accountsMerged > 0;
  const hasTransactions = transactionsMerged > 0;

  if (!hasAccounts && !hasTransactions) {
    return "Already in sync";
  }

  const accountText = hasAccounts
    ? `${accountsMerged} ${accountsMerged === 1 ? "account" : "accounts"}`
    : null;

  const transactionText = hasTransactions
    ? `${transactionsMerged} ${transactionsMerged === 1 ? "transaction" : "transactions"}`
    : null;

  if (accountText && transactionText) {
    return `Synced ${accountText} and ${transactionText}`;
  }

  return `Synced ${accountText || transactionText}`;
}
