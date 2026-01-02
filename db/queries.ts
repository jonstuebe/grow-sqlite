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

// ============================================================================
// Account Queries
// ============================================================================

/**
 * Get all accounts with their computed current_amount from transactions
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
    ORDER BY a.created_at DESC
  `);

  return rows;
}

/**
 * Get a single account by ID with computed current_amount
 */
export async function getAccount(
  db: SQLiteDatabase,
  id: string
): Promise<Account | null> {
  const row = await db.getFirstAsync<AccountRow & { current_amount: number }>(`
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
  `, [id]);

  return row ?? null;
}

/**
 * Get total balance across all accounts
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
  `);

  return result?.total ?? 0;
}

/**
 * Create a new account
 */
export async function createAccount(
  db: SQLiteDatabase,
  input: CreateAccountInput
): Promise<Account> {
  const id = uuid();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO accounts (id, name, target_amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.target_amount, now, now]
  );

  // Return the newly created account
  const account = await getAccount(db, id);
  if (!account) {
    throw new Error("Failed to create account");
  }

  return account;
}

/**
 * Update an existing account
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
    values.push(input.target_amount);
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
 */
export async function getTransactions(
  db: SQLiteDatabase,
  accountId?: string
): Promise<Transaction[]> {
  if (accountId) {
    return db.getAllAsync<Transaction>(
      `SELECT * FROM transactions 
       WHERE account_id = ? OR related_account_id = ?
       ORDER BY created_at DESC`,
      [accountId, accountId]
    );
  }

  return db.getAllAsync<Transaction>(
    "SELECT * FROM transactions ORDER BY created_at DESC"
  );
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(
  db: SQLiteDatabase,
  id: string
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<Transaction>(
    "SELECT * FROM transactions WHERE id = ?",
    [id]
  );

  return row ?? null;
}

/**
 * Create a new transaction
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
    `INSERT INTO transactions (id, account_id, amount, type, description, related_account_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.account_id,
      input.amount,
      input.type,
      input.description ?? null,
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

