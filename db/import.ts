import type { SQLiteDatabase } from "expo-sqlite";

import { dollarsToCents } from "@/utils/currency";
import { uuid } from "./uuid";

// Re-export types and pure functions from parser
export type {
  LegacyTransaction,
  LegacyItem,
  LegacyBackupData,
  ImportPreview,
} from "./import-parser";

export {
  parseLegacyBackup,
  getImportPreview,
  getItemsArray,
  getTransactionTimestamp,
  convertLegacyItemForDb,
  hasGoalEnabled,
} from "./import-parser";

import {
  getItemsArray,
  getTransactionTimestamp,
  hasGoalEnabled,
  calculateAdjustmentAmount,
  type LegacyBackupData,
} from "./import-parser";

// ============================================================================
// Import
// ============================================================================

/**
 * Get the earliest transaction timestamp from an item
 */
function getEarliestTimestamp(
  transactions: Array<{ date: Date | number }>
): number {
  if (transactions.length === 0) {
    return Date.now();
  }

  return transactions.reduce((earliest, txn) => {
    const timestamp = getTransactionTimestamp(txn.date);
    return timestamp < earliest ? timestamp : earliest;
  }, getTransactionTimestamp(transactions[0].date));
}

/**
 * Import legacy backup data into the SQLite database
 * Uses a transaction to ensure atomicity
 */
export async function importLegacyData(
  db: SQLiteDatabase,
  data: LegacyBackupData
): Promise<{ accountsImported: number; transactionsImported: number }> {
  const items = getItemsArray(data);
  let accountsImported = 0;
  let transactionsImported = 0;

  await db.withTransactionAsync(async () => {
    for (const item of items) {
      const now = Date.now();

      // Generate a new UUID for the account (don't reuse old IDs)
      const accountId = uuid();

      // Determine goal settings: goalAmount !== null means goal is enabled
      const goalEnabled = hasGoalEnabled(item);
      const targetAmount = goalEnabled ? dollarsToCents(item.goalAmount!) : 0;

      // Insert account
      await db.runAsync(
        `INSERT INTO accounts (id, name, target_amount, goal_enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [accountId, item.name, targetAmount, goalEnabled ? 1 : 0, now, now]
      );
      accountsImported++;

      // Check if we need an adjustment transaction
      const adjustment = calculateAdjustmentAmount(item);
      if (adjustment !== 0) {
        const txnId = uuid();
        const earliestTimestamp = getEarliestTimestamp(item.transactions);
        const adjustmentTimestamp = earliestTimestamp - 1;

        await db.runAsync(
          `INSERT INTO transactions (id, account_id, amount, type, related_account_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            txnId,
            accountId,
            dollarsToCents(Math.abs(adjustment)),
            adjustment > 0 ? "deposit" : "withdrawal",
            null,
            adjustmentTimestamp,
            adjustmentTimestamp,
          ]
        );
        transactionsImported++;
      }

      // Insert original transactions
      for (const txn of item.transactions) {
        const txnId = uuid();
        const txnDate = getTransactionTimestamp(txn.date);

        await db.runAsync(
          `INSERT INTO transactions (id, account_id, amount, type, related_account_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            txnId,
            accountId,
            dollarsToCents(txn.amount),
            txn.type,
            null, // legacy app didn't have transfers with related accounts
            txnDate,
            txnDate,
          ]
        );
        transactionsImported++;
      }
    }
  });

  return { accountsImported, transactionsImported };
}
