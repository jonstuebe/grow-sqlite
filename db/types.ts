/**
 * Database entity types for the grow app
 */

export interface Account {
  id: string;
  name: string;
  target_amount: number;
  goal_enabled: boolean;
  archived_at: number | null;
  current_amount: number; // computed from SUM of transactions
  created_at: number;
  updated_at: number;
}

/** Raw account row from the database (without computed fields) */
export interface AccountRow {
  id: string;
  name: string;
  target_amount: number;
  goal_enabled: number; // SQLite stores as INTEGER (0 or 1)
  archived_at: number | null;
  created_at: number;
  updated_at: number;
}

export type TransactionType = "deposit" | "withdrawal" | "transfer";

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  related_account_id: string | null;
  created_at: number;
  updated_at: number;
}

/** Input for creating a new account */
export interface CreateAccountInput {
  name: string;
  target_amount: number;
}

/** Input for updating an existing account */
export interface UpdateAccountInput {
  name?: string;
  target_amount?: number;
  goal_enabled?: boolean;
}

/** Input for creating a new transaction */
export interface CreateTransactionInput {
  account_id: string;
  amount: number;
  type: TransactionType;
  related_account_id?: string; // required for transfers
}
