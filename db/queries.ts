import type { SQLiteDatabase } from "expo-sqlite";

import type {
  Account,
  AccountRow,
  Transaction,
  CreateAccountInput,
  UpdateAccountInput,
  CreateTransactionInput,
} from "./types";
import { uuid } from "./uuid";
import { centsToDollars, dollarsToCents } from "@/utils/currency";

// ============================================================================
// Account Queries
// ============================================================================

/**
 * Get all accounts with their computed current_amount from transactions
 * Excludes archived accounts
 * Note: Converts cents from DB to dollars for app consumption
 */
export async function getAccounts(db: SQLiteDatabase): Promise<Account[]> {
  const rows = await db.getAllAsync<AccountRow & { current_amount: number }>(`
    SELECT 
      a.*,
      COALESCE(
        (SELECT SUM(
          CASE 
            WHEN t.type = 'deposit' THEN t.amount
            WHEN t.type = 'withdrawal' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.related_account_id = a.id THEN t.amount
            ELSE 0
          END
        ) FROM transactions t 
        WHERE t.account_id = a.id OR t.related_account_id = a.id),
        0
      ) as current_amount
    FROM accounts a
    WHERE a.archived_at IS NULL
    ORDER BY a.created_at DESC
  `);

  return rows.map((row) => ({
    ...row,
    goal_enabled: Boolean(row.goal_enabled),
    target_amount: centsToDollars(row.target_amount),
    current_amount: centsToDollars(row.current_amount),
  }));
}

/**
 * Get a single account by ID with computed current_amount
 * Note: Converts cents from DB to dollars for app consumption
 */
export async function getAccount(
  db: SQLiteDatabase,
  id: string
): Promise<Account | null> {
  const row = await db.getFirstAsync<AccountRow & { current_amount: number }>(
    `
    SELECT 
      a.*,
      COALESCE(
        (SELECT SUM(
          CASE 
            WHEN t.type = 'deposit' THEN t.amount
            WHEN t.type = 'withdrawal' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.related_account_id = a.id THEN t.amount
            ELSE 0
          END
        ) FROM transactions t 
        WHERE t.account_id = a.id OR t.related_account_id = a.id),
        0
      ) as current_amount
    FROM accounts a
    WHERE a.id = ?
  `,
    [id]
  );

  if (!row) return null;

  return {
    ...row,
    goal_enabled: Boolean(row.goal_enabled),
    target_amount: centsToDollars(row.target_amount),
    current_amount: centsToDollars(row.current_amount),
  };
}

/**
 * Get total balance across all non-archived accounts
 * Note: Converts cents from DB to dollars for app consumption
 */
export async function getTotalBalance(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(`
    SELECT COALESCE(SUM(
      CASE 
        WHEN type = 'deposit' THEN amount
        WHEN type = 'withdrawal' THEN -amount
        ELSE 0
      END
    ), 0) as total
    FROM transactions
    WHERE account_id IN (SELECT id FROM accounts WHERE archived_at IS NULL)
  `);

  return centsToDollars(result?.total ?? 0);
}

/**
 * Create a new account
 * Note: Converts dollars from app to cents for DB storage
 */
export async function createAccount(
  db: SQLiteDatabase,
  input: CreateAccountInput
): Promise<Account> {
  const id = uuid();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO accounts (id, name, target_amount, goal_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.name, dollarsToCents(input.target_amount), 1, now, now]
  );

  // Return the newly created account
  const account = await getAccount(db, id);
  if (!account) {
    throw new Error("Failed to create account");
  }

  return account;
}

/** Input for creating an account with an initial balance */
export interface CreateAccountWithInitialBalanceInput extends CreateAccountInput {
  initialBalance?: number;
  goalEnabled?: boolean;
}

/**
 * Create a new account with an optional initial balance using a SQL transaction
 * Note: Converts dollars from app to cents for DB storage
 */
export async function createAccountWithInitialBalance(
  db: SQLiteDatabase,
  input: CreateAccountWithInitialBalanceInput
): Promise<Account> {
  const accountId = uuid();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    // Insert the account
    await db.runAsync(
      `INSERT INTO accounts (id, name, target_amount, goal_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        input.name,
        dollarsToCents(input.target_amount),
        input.goalEnabled ? 1 : 0,
        now,
        now,
      ]
    );

    // If there's an initial balance, create a deposit transaction
    if (input.initialBalance && input.initialBalance > 0) {
      const transactionId = uuid();
      await db.runAsync(
        `INSERT INTO transactions (id, account_id, amount, type, related_account_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          accountId,
          dollarsToCents(input.initialBalance),
          "deposit",
          null,
          now,
          now,
        ]
      );
    }
  });

  // Return the newly created account
  const account = await getAccount(db, accountId);
  if (!account) {
    throw new Error("Failed to create account");
  }

  return account;
}

/**
 * Update an existing account
 * Note: Converts dollars from app to cents for DB storage
 */
export async function updateAccount(
  db: SQLiteDatabase,
  id: string,
  input: UpdateAccountInput
): Promise<Account> {
  const now = Date.now();
  const updates: string[] = ["updated_at = ?"];
  const values: (string | number)[] = [now];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }

  if (input.target_amount !== undefined) {
    updates.push("target_amount = ?");
    values.push(dollarsToCents(input.target_amount));
  }

  if (input.goal_enabled !== undefined) {
    updates.push("goal_enabled = ?");
    values.push(input.goal_enabled ? 1 : 0);
  }

  values.push(id);

  await db.runAsync(
    `UPDATE accounts SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  const account = await getAccount(db, id);
  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

/**
 * Archive an account (soft delete)
 */
export async function archiveAccount(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    "UPDATE accounts SET archived_at = ?, updated_at = ? WHERE id = ?",
    [now, now, id]
  );
}

/**
 * Delete an account (transactions are cascade deleted)
 */
export async function deleteAccount(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM accounts WHERE id = ?", [id]);
}

// ============================================================================
// Transaction Queries
// ============================================================================

/**
 * Get all transactions, optionally filtered by account
 * Note: Converts cents from DB to dollars for app consumption
 */
export async function getTransactions(
  db: SQLiteDatabase,
  accountId?: string
): Promise<Transaction[]> {
  let rows: Transaction[];

  if (accountId) {
    rows = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions 
       WHERE account_id = ? OR related_account_id = ?
       ORDER BY created_at DESC`,
      [accountId, accountId]
    );
  } else {
    rows = await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions ORDER BY created_at DESC"
    );
  }

  return rows.map((row) => ({
    ...row,
    amount: centsToDollars(row.amount),
  }));
}

/**
 * Get a single transaction by ID
 * Note: Converts cents from DB to dollars for app consumption
 */
export async function getTransaction(
  db: SQLiteDatabase,
  id: string
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<Transaction>(
    "SELECT * FROM transactions WHERE id = ?",
    [id]
  );

  if (!row) return null;

  return {
    ...row,
    amount: centsToDollars(row.amount),
  };
}

/**
 * Create a new transaction
 * Note: Converts dollars from app to cents for DB storage
 */
export async function createTransaction(
  db: SQLiteDatabase,
  input: CreateTransactionInput
): Promise<Transaction> {
  const id = uuid();
  const now = Date.now();

  // Validate transfer has related_account_id
  if (input.type === "transfer" && !input.related_account_id) {
    throw new Error("Transfer transactions require a related_account_id");
  }

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, amount, type, related_account_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.account_id,
      dollarsToCents(input.amount),
      input.type,
      input.related_account_id ?? null,
      now,
      now,
    ]
  );

  const transaction = await getTransaction(db, id);
  if (!transaction) {
    throw new Error("Failed to create transaction");
  }

  return transaction;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}
