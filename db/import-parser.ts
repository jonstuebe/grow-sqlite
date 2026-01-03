import { dollarsToCents } from "@/utils/currency";

// ============================================================================
// Legacy Backup Types (from grow-local app)
// ============================================================================

/** Legacy transaction from the old app */
export interface LegacyTransaction {
  id: string;
  type: "withdrawal" | "deposit";
  amount: number; // dollars (float)
  date: Date | number; // Could be Date object or timestamp
}

/** Legacy item (account) from the old app */
export interface LegacyItem {
  id: string;
  name: string;
  curAmount: number; // dollars (float) - we'll ignore this, compute from transactions
  goal: boolean; // Legacy field, not used - goalAmount determines if goal is enabled
  goalAmount?: number | null; // dollars (float), null/undefined means no goal
  transactions: LegacyTransaction[];
}

/** The shape of parsed legacy backup data */
export interface LegacyBackupData {
  items: Map<string, LegacyItem> | Record<string, LegacyItem>;
}

/** Preview info for displaying to the user before import */
export interface ImportPreview {
  accountCount: number;
  transactionCount: number;
  accounts: Array<{
    name: string;
    balance: number; // computed from transactions, in dollars
    hasGoal: boolean;
    goalAmount?: number | null;
  }>;
}

/**
 * Check if a legacy item has a goal enabled.
 * A goal is enabled when goalAmount is a number (not null or undefined).
 */
export function hasGoalEnabled(item: LegacyItem): boolean {
  return typeof item.goalAmount === "number";
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Type guard to check if an object is a LegacyItem
 */
function isLegacyItem(obj: unknown): obj is LegacyItem {
  if (typeof obj !== "object" || obj === null) return false;
  const item = obj as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.curAmount === "number" &&
    Array.isArray(item.transactions)
  );
}

/**
 * Parse a legacy backup JSON string
 * The backup format is: { json: Record<string, LegacyItem> }
 * Returns the parsed data or throws an error if invalid
 */
export function parseLegacyBackup(jsonString: string): LegacyBackupData {
  try {
    const rawParsed = JSON.parse(jsonString);

    // Extract from "json" wrapper if present (standard backup format)
    const dataToProcess =
      typeof rawParsed === "object" && rawParsed !== null && "json" in rawParsed
        ? rawParsed.json
        : rawParsed;

    // Check if it's a single item
    if (isLegacyItem(dataToProcess)) {
      return { items: { [dataToProcess.id]: dataToProcess } };
    }

    // Should be a Record<string, LegacyItem>
    if (typeof dataToProcess === "object" && dataToProcess !== null) {
      const entries = Object.entries(dataToProcess);
      if (entries.length === 0) {
        throw new Error("Backup file contains no items");
      }

      // Check first entry to validate structure
      const [, firstItem] = entries[0];
      if (!isLegacyItem(firstItem)) {
        throw new Error(
          "Invalid backup format: items don't match expected structure"
        );
      }

      return { items: dataToProcess as Record<string, LegacyItem> };
    }

    throw new Error("Invalid backup format");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse backup: ${error.message}`);
    }
    throw new Error("Failed to parse backup: unknown error");
  }
}

/**
 * Get items from backup data (handles both Map and Record)
 */
export function getItemsArray(data: LegacyBackupData): LegacyItem[] {
  if (data.items instanceof Map) {
    return Array.from(data.items.values());
  }
  return Object.values(data.items);
}

// ============================================================================
// Preview
// ============================================================================

/**
 * Generate a preview of what will be imported
 */
export function getImportPreview(data: LegacyBackupData): ImportPreview {
  const items = getItemsArray(data);

  let transactionCount = 0;
  const accounts = items.map((item) => {
    // Count original transactions plus potential adjustment transaction
    const adjustment = calculateAdjustmentAmount(item);
    const adjustmentCount = adjustment !== 0 ? 1 : 0;
    transactionCount += item.transactions.length + adjustmentCount;

    // Use curAmount from the backup - this is the authoritative balance
    const balance = item.curAmount;

    return {
      name: item.name,
      balance,
      hasGoal: hasGoalEnabled(item),
      goalAmount: item.goalAmount,
    };
  });

  return {
    accountCount: items.length,
    transactionCount,
    accounts,
  };
}

// ============================================================================
// Helpers for import (used by import.ts)
// ============================================================================

/**
 * Get the timestamp from a transaction date
 * Handles both Date objects and number timestamps
 */
export function getTransactionTimestamp(date: Date | number): number {
  if (date instanceof Date) {
    return date.getTime();
  }
  return date;
}

/**
 * Calculate balance from transactions (deposits - withdrawals)
 */
export function calculateBalanceFromTransactions(
  transactions: LegacyTransaction[]
): number {
  return transactions.reduce((acc, txn) => {
    return txn.type === "deposit" ? acc + txn.amount : acc - txn.amount;
  }, 0);
}

/**
 * Calculate the adjustment needed to reconcile curAmount with transaction sum.
 * Returns the amount (in dollars) that needs to be added as an initial deposit
 * to make the math work out. Returns 0 if no adjustment needed.
 */
export function calculateAdjustmentAmount(item: LegacyItem): number {
  const calculatedBalance = calculateBalanceFromTransactions(item.transactions);
  const delta = item.curAmount - calculatedBalance;

  // Only return non-zero if there's a meaningful difference (avoid floating point noise)
  return Math.abs(delta) > 0.001 ? delta : 0;
}

/**
 * Get the earliest transaction timestamp from an item, or a default timestamp
 * if there are no transactions
 */
function getEarliestTimestamp(item: LegacyItem): number {
  if (item.transactions.length === 0) {
    return Date.now();
  }

  return item.transactions.reduce((earliest, txn) => {
    const timestamp = getTransactionTimestamp(txn.date);
    return timestamp < earliest ? timestamp : earliest;
  }, getTransactionTimestamp(item.transactions[0].date));
}

/**
 * Convert a legacy item to database-ready format.
 * If there's a discrepancy between curAmount and the sum of transactions,
 * an adjustment transaction is added at the beginning to reconcile.
 */
export function convertLegacyItemForDb(item: LegacyItem): {
  name: string;
  targetAmountCents: number;
  goalEnabled: boolean;
  transactions: Array<{
    amountCents: number;
    type: "deposit" | "withdrawal";
    timestamp: number;
  }>;
} {
  const goalEnabled = hasGoalEnabled(item);
  const targetAmountCents = goalEnabled ? dollarsToCents(item.goalAmount!) : 0;

  const transactions: Array<{
    amountCents: number;
    type: "deposit" | "withdrawal";
    timestamp: number;
  }> = [];

  // Check if we need an adjustment transaction
  const adjustment = calculateAdjustmentAmount(item);
  if (adjustment !== 0) {
    // Place adjustment 1ms before the earliest transaction
    const earliestTimestamp = getEarliestTimestamp(item);
    const adjustmentTimestamp = earliestTimestamp - 1;

    if (adjustment > 0) {
      // Need to add money - create a deposit
      transactions.push({
        amountCents: dollarsToCents(adjustment),
        type: "deposit",
        timestamp: adjustmentTimestamp,
      });
    } else {
      // Need to remove money - create a withdrawal
      transactions.push({
        amountCents: dollarsToCents(Math.abs(adjustment)),
        type: "withdrawal",
        timestamp: adjustmentTimestamp,
      });
    }
  }

  // Add all the original transactions
  for (const txn of item.transactions) {
    transactions.push({
      amountCents: dollarsToCents(txn.amount),
      type: txn.type,
      timestamp: getTransactionTimestamp(txn.date),
    });
  }

  return {
    name: item.name,
    targetAmountCents,
    goalEnabled,
    transactions,
  };
}
