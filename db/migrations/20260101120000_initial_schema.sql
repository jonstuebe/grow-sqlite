-- Initial schema for grow app
-- Creates accounts table to track savings goals
-- Note: All IDs are UUIDs generated client-side (React Native), not by the database
-- Note: current_amount is derived from SUM of transactions, not stored

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_created ON accounts(created_at);

-- Transactions table to track deposits, withdrawals, and transfers
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer')),
  description TEXT,
  related_account_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (related_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TRIGGER IF NOT EXISTS update_transaction_updated_at
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
  UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
