import type { SQLiteDatabase } from "expo-sqlite";

import { uuid } from "./uuid";

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
  const accounts = [
    {
      id: accountIds.house,
      name: "House",
      target_amount: 50000,
    },
    {
      id: accountIds.vacation,
      name: "Vacation",
      target_amount: 5000,
    },
    {
      id: accountIds.emergency,
      name: "Emergency Fund",
      target_amount: 10000,
    },
    {
      id: accountIds.car,
      name: "New Car",
      target_amount: 25000,
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
  const transactions = [
    {
      id: uuid(),
      account_id: accountIds.house,
      amount: 10000,
      type: "deposit",
      description: "Initial deposit",
    },
    {
      id: uuid(),
      account_id: accountIds.house,
      amount: 2500,
      type: "deposit",
      description: "Monthly savings",
    },
    {
      id: uuid(),
      account_id: accountIds.vacation,
      amount: 2000,
      type: "deposit",
      description: "Tax refund",
    },
    {
      id: uuid(),
      account_id: accountIds.vacation,
      amount: 200,
      type: "deposit",
      description: "Weekly savings",
    },
    {
      id: uuid(),
      account_id: accountIds.emergency,
      amount: 8000,
      type: "deposit",
      description: "Initial deposit",
    },
    {
      id: uuid(),
      account_id: accountIds.emergency,
      amount: 500,
      type: "withdrawal",
      description: "Car repair",
    },
    {
      id: uuid(),
      account_id: accountIds.car,
      amount: 5000,
      type: "deposit",
      description: "Initial deposit",
    },
    {
      id: uuid(),
      account_id: accountIds.car,
      amount: 3000,
      type: "deposit",
      description: "Bonus",
    },
  ];

  // Insert transactions
  for (const txn of transactions) {
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, amount, type, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [txn.id, txn.account_id, txn.amount, txn.type, txn.description, now, now]
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
