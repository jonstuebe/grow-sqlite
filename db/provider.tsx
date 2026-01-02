import {
  SQLiteProvider as ExpoSQLiteProvider,
  useSQLiteContext,
  defaultDatabaseDirectory,
  type SQLiteDatabase,
} from "expo-sqlite";
import { Suspense, useCallback, type PropsWithChildren } from "react";
import { ActivityIndicator, View, Text, StyleSheet, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { registerDevMenuItems } from "expo-dev-menu";

import { runMigrations, resetDatabase } from "./migrate";
import { runSeed, clearSeed } from "./seed";

const DATABASE_NAME = "grow.db";

// Store db instance for dev menu access
let devDb: SQLiteDatabase | null = null;

// Register dev menu item to show/copy database path
if (__DEV__) {
  const dbPath = `${defaultDatabaseDirectory}/${DATABASE_NAME}`;

  registerDevMenuItems([
    {
      name: "Copy Database Path",
      callback: async () => {
        await Clipboard.setStringAsync(dbPath);
        Alert.alert("Database Path Copied!", dbPath);
      },
    },
    {
      name: "Reset Database",
      callback: async () => {
        if (devDb) {
          await resetDatabase(devDb);
          Alert.alert(
            "Database Reset",
            "All tables dropped, migrations re-applied, and data seeded. Please reload the app."
          );
        } else {
          Alert.alert("Error", "Database not initialized yet");
        }
      },
    },
  ]);
}

/**
 * Initialize database - runs migrations and optionally seeds
 */
async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  console.log("[db] Initializing database...");

  // Store db instance for dev menu access
  if (__DEV__) {
    devDb = db;
  }

  // Enable foreign keys
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Enable WAL mode for better performance
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // Run pending migrations
  await runMigrations(db);

  // Seed in development mode
  if (__DEV__) {
    await runSeed(db);
  }

  console.log("[db] Database initialization complete");
}

/**
 * Loading component shown during database initialization
 */
function LoadingDatabase() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

/**
 * Database provider component that wraps the app with SQLite context
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<LoadingDatabase />}>
      <ExpoSQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={initializeDatabase}
        useSuspense
      >
        {children}
      </ExpoSQLiteProvider>
    </Suspense>
  );
}

/**
 * Re-export useSQLiteContext for convenience
 */
export { useSQLiteContext };

/**
 * Hook for development utilities
 * Returns helper functions for reset and reseed operations
 */
export function useDevDatabase() {
  const db = useSQLiteContext();

  const reset = useCallback(async () => {
    if (!__DEV__) {
      console.warn("[db] reset() can only be used in development mode");
      return;
    }
    await resetDatabase(db);
  }, [db]);

  const reseed = useCallback(async () => {
    if (!__DEV__) {
      console.warn("[db] reseed() can only be used in development mode");
      return;
    }
    await clearSeed(db);
    await runSeed(db);
  }, [db]);

  return { reset, reseed };
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
  },
});
