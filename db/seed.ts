import type { SQLiteDatabase } from "expo-sqlite";

import { uuid } from "@/db/uuid";
import { dollarsToCents } from "@/utils/currency";

/**
 * Seed the database with sample data for development
 * Only runs in DEV mode and is idempotent (safe to run multiple times)
 */
export async function runSeed(db: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    console.log("[seed] Skipping seed in production mode");
    return;
  }

  console.log("[seed] Seeding database with sample data...");

  const now = Date.now();

  // Check if already seeded
  const existingAccounts = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM accounts"
  );

  if (existingAccounts && existingAccounts.count > 0) {
    console.log("[seed] Database already has data, skipping seed");
    return;
  }

  // Generate UUIDs for accounts (so we can reference them in transactions)
  const accountIds = {
    house: uuid(),
    vacation: uuid(),
    emergency: uuid(),
    car: uuid(),
  };

  // Sample accounts (current_amount is derived from transactions)
  // Note: target_amount is in cents
  const accounts = [
    {
      id: accountIds.house,
      name: "House",
      target_amount: dollarsToCents(50000), // $50,000
    },
    {
      id: accountIds.vacation,
      name: "Vacation",
      target_amount: dollarsToCents(5000), // $5,000
    },
    {
      id: accountIds.emergency,
      name: "Emergency Fund",
      target_amount: dollarsToCents(10000), // $10,000
    },
    {
      id: accountIds.car,
      name: "New Car",
      target_amount: dollarsToCents(25000), // $25,000
    },
  ];

  // Insert accounts
  for (const account of accounts) {
    await db.runAsync(
      `INSERT INTO accounts (id, name, target_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [account.id, account.name, account.target_amount, now, now]
    );
  }

  // Sample transactions (deposits add, withdrawals subtract)
  // Note: amount is in cents
  const transactions = [
    {
      id: uuid(),
      account_id: accountIds.house,
      amount: dollarsToCents(10000), // $10,000
      type: "deposit",
      description: "Initial deposit",
    },
    {
      id: uuid(),
      account_id: accountIds.house,
      amount: dollarsToCents(2500), // $2,500
      type: "deposit",
      description: "Monthly savings",
    },
    {
      id: uuid(),
      account_id: accountIds.vacation,
      amount: dollarsToCents(2000), // $2,000
      type: "deposit",
      description: "Tax refund",
    },
    {
      id: uuid(),
      account_id: accountIds.vacation,
      amount: dollarsToCents(200), // $200
      type: "deposit",
      description: "Weekly savings",
    },
    {
      id: uuid(),
      account_id: accountIds.emergency,
      amount: dollarsToCents(8000), // $8,000
      type: "deposit",
      description: "Initial deposit",
    },
    {
      id: uuid(),
      account_id: accountIds.emergency,
      amount: dollarsToCents(500), // $500
      type: "withdrawal",
      description: "Car repair",
    },
    {
      id: uuid(),
      account_id: accountIds.car,
      amount: dollarsToCents(5000), // $5,000
      type: "deposit",
      description: "Initial deposit",
    },
    {
      id: uuid(),
      account_id: accountIds.car,
      amount: dollarsToCents(3000), // $3,000
      type: "deposit",
      description: "Bonus",
    },
    // Transfers
    {
      id: uuid(),
      account_id: accountIds.emergency,
      related_account_id: accountIds.vacation,
      amount: dollarsToCents(500), // $500
      type: "transfer",
      description: "Vacation fund boost",
    },
    {
      id: uuid(),
      account_id: accountIds.car,
      related_account_id: accountIds.house,
      amount: dollarsToCents(1000), // $1,000
      type: "transfer",
      description: "Reallocation to house fund",
    },
  ];

  // Insert transactions
  for (const txn of transactions) {
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, amount, type, description, related_account_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txn.id,
        txn.account_id,
        txn.amount,
        txn.type,
        txn.description,
        "related_account_id" in txn ? txn.related_account_id ?? null : null,
        now,
        now,
      ]
    );
  }

  console.log("[seed] Database seeded successfully");
}

/**
 * Clear all seed data (useful for re-seeding)
 * Only runs in DEV mode
 */
export async function clearSeed(db: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    console.log("[seed] Skipping clear in production mode");
    return;
  }

  console.log("[seed] Clearing seed data...");

  // Delete in correct order due to foreign keys
  await db.runAsync("DELETE FROM transactions");
  await db.runAsync("DELETE FROM accounts");

  console.log("[seed] Seed data cleared");
}
