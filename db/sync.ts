/**
 * Sync types and logic for peer-to-peer data synchronization
 */

import type { AccountRow, Transaction } from "./types";

// ============================================================================
// Message Types
// ============================================================================

export type SyncMessageType =
  | "SYNC_REQUEST"
  | "SYNC_RESPONSE"
  | "SYNC_DATA"
  | "SYNC_ACK";

/** Base interface for all sync messages */
interface BaseSyncMessage {
  type: SyncMessageType;
  timestamp: number;
}

/**
 * Initial sync request from Device A to Device B
 * Contains the last time these devices synced (0 for first sync)
 */
export interface SyncRequest extends BaseSyncMessage {
  type: "SYNC_REQUEST";
  lastSyncTime: number;
}

/**
 * Response from Device B with its changed data
 * Sent after receiving a SYNC_REQUEST
 */
export interface SyncResponse extends BaseSyncMessage {
  type: "SYNC_RESPONSE";
  accounts: AccountRow[];
  transactions: Transaction[];
}

/**
 * Device A sends its changed data to Device B
 * Sent after receiving and processing SYNC_RESPONSE
 */
export interface SyncData extends BaseSyncMessage {
  type: "SYNC_DATA";
  accounts: AccountRow[];
  transactions: Transaction[];
}

/**
 * Acknowledgment that sync completed
 */
export interface SyncAck extends BaseSyncMessage {
  type: "SYNC_ACK";
  success: boolean;
  error?: string;
  accountsMerged: number;
  transactionsMerged: number;
}

export type SyncMessage = SyncRequest | SyncResponse | SyncData | SyncAck;

// ============================================================================
// Message Helpers
// ============================================================================

/**
 * Create a sync request message
 */
export function createSyncRequest(lastSyncTime: number = 0): SyncRequest {
  return {
    type: "SYNC_REQUEST",
    timestamp: Date.now(),
    lastSyncTime,
  };
}

/**
 * Create a sync response message
 */
export function createSyncResponse(
  accounts: AccountRow[],
  transactions: Transaction[]
): SyncResponse {
  return {
    type: "SYNC_RESPONSE",
    timestamp: Date.now(),
    accounts,
    transactions,
  };
}

/**
 * Create a sync data message
 */
export function createSyncData(
  accounts: AccountRow[],
  transactions: Transaction[]
): SyncData {
  return {
    type: "SYNC_DATA",
    timestamp: Date.now(),
    accounts,
    transactions,
  };
}

/**
 * Create a sync acknowledgment message
 */
export function createSyncAck(
  success: boolean,
  accountsMerged: number,
  transactionsMerged: number,
  error?: string
): SyncAck {
  return {
    type: "SYNC_ACK",
    timestamp: Date.now(),
    success,
    accountsMerged,
    transactionsMerged,
    error,
  };
}

/**
 * Parse an incoming sync message from JSON string
 */
export function parseSyncMessage(json: string): SyncMessage | null {
  try {
    const data = JSON.parse(json);
    if (
      data &&
      typeof data === "object" &&
      "type" in data &&
      ["SYNC_REQUEST", "SYNC_RESPONSE", "SYNC_DATA", "SYNC_ACK"].includes(
        data.type
      )
    ) {
      return data as SyncMessage;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Merge Logic
// ============================================================================

/**
 * Merge result for a single record
 */
export interface MergeResult<T> {
  /** Records to insert (new) */
  toInsert: T[];
  /** Records to update (remote is newer) */
  toUpdate: T[];
  /** Count of records kept as-is (local is newer or same) */
  keptLocal: number;
}

/**
 * Compare and merge accounts using latest-wins strategy
 * @param localAccounts - Current local accounts
 * @param remoteAccounts - Incoming remote accounts
 * @returns Records to insert and update
 */
export function mergeAccounts(
  localAccounts: AccountRow[],
  remoteAccounts: AccountRow[]
): MergeResult<AccountRow> {
  const localMap = new Map(localAccounts.map((a) => [a.id, a]));
  const toInsert: AccountRow[] = [];
  const toUpdate: AccountRow[] = [];
  let keptLocal = 0;

  for (const remote of remoteAccounts) {
    const local = localMap.get(remote.id);

    if (!local) {
      // New record - insert
      toInsert.push(remote);
    } else if (remote.updated_at > local.updated_at) {
      // Remote is newer - update
      toUpdate.push(remote);
    } else {
      // Local is newer or same - keep local
      keptLocal++;
    }
  }

  return { toInsert, toUpdate, keptLocal };
}

/**
 * Compare and merge transactions using latest-wins strategy
 * @param localTransactions - Current local transactions
 * @param remoteTransactions - Incoming remote transactions
 * @returns Records to insert and update
 */
export function mergeTransactions(
  localTransactions: Transaction[],
  remoteTransactions: Transaction[]
): MergeResult<Transaction> {
  const localMap = new Map(localTransactions.map((t) => [t.id, t]));
  const toInsert: Transaction[] = [];
  const toUpdate: Transaction[] = [];
  let keptLocal = 0;

  for (const remote of remoteTransactions) {
    const local = localMap.get(remote.id);

    if (!local) {
      // New record - insert
      toInsert.push(remote);
    } else if (remote.updated_at > local.updated_at) {
      // Remote is newer - update
      toUpdate.push(remote);
    } else {
      // Local is newer or same - keep local
      keptLocal++;
    }
  }

  return { toInsert, toUpdate, keptLocal };
}
