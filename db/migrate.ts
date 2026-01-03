import type { SQLiteDatabase } from "expo-sqlite";

// Import migrations statically - add new imports here as you create migrations
import migration_20260101120000 from "./migrations/20260101120000_initial_schema.sql";

// Migration registry - add new migrations here in order
export const migrations: { name: string; sql: string }[] = [
  { name: "20260101120000_initial_schema", sql: migration_20260101120000 },
];

/**
 * Create the migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `);
}

/**
 * Get list of already applied migrations from the database
 */
async function getAppliedMigrations(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM migrations ORDER BY id ASC"
  );
  return rows.map((row) => row.name);
}

/**
 * Apply a single migration within a transaction
 */
async function applyMigration(
  db: SQLiteDatabase,
  name: string,
  sql: string
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Execute the migration SQL
    await db.execAsync(sql);

    // Record the migration
    await db.runAsync(
      "INSERT INTO migrations (name, applied_at) VALUES (?, ?)",
      [name, Date.now()]
    );
  });

  console.log(`[migrate] Applied: ${name}`);
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await ensureMigrationsTable(db);

  const applied = await getAppliedMigrations(db);
  const pending = migrations.filter((m) => !applied.includes(m.name));

  if (pending.length === 0) {
    console.log("[migrate] No pending migrations");
    return;
  }

  console.log(`[migrate] Running ${pending.length} pending migration(s)...`);

  for (const migration of pending) {
    await applyMigration(db, migration.name, migration.sql);
  }

  console.log("[migrate] All migrations complete");
}

/**
 * Get all table names in the database (excluding sqlite internals)
 */
async function getAllTables(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return rows.map((row) => row.name);
}

/**
 * Reset database - drops ALL tables and re-runs migrations
 * WARNING: Only use in development!
 */
export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    throw new Error("resetDatabase can only be used in development mode");
  }

  console.log("[migrate] Resetting database...");

  // Disable foreign keys temporarily for clean drop
  await db.execAsync("PRAGMA foreign_keys = OFF;");

  // Get all tables (including migrations table)
  const tables = await getAllTables(db);

  // Drop all tables
  for (const table of tables) {
    await db.execAsync(`DROP TABLE IF EXISTS "${table}"`);
    console.log(`[migrate] Dropped table: ${table}`);
  }

  // Re-enable foreign keys
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Re-run all migrations from scratch
  await runMigrations(db);

  console.log("[migrate] Database reset complete");
}
