/**
 * Sync types and logic for peer-to-peer data synchronization
 */

import type { AccountRow, Transaction } from "./types";

// ============================================================================
// Protocol Version
// ============================================================================

/**
 * Sync protocol version - increment when:
 * - Database schema changes
 * - Sync message format changes
 * - Merge logic changes
 *
 * Version bumping guide:
 * - Major (1.0.0 -> 2.0.0): Breaking schema changes, incompatible message format
 * - Minor (1.0.0 -> 1.1.0): New optional fields, backward-compatible additions
 * - Patch (1.0.0 -> 1.0.1): Bug fixes in sync logic
 */
export const SYNC_PROTOCOL_VERSION = "1.0.0";

/**
 * Check if two protocol versions are compatible (same major version)
 * @param v1 - First version string (e.g., "1.0.0")
 * @param v2 - Second version string (e.g., "1.1.0")
 * @returns true if major versions match
 */
export function areVersionsCompatible(v1: string, v2: string): boolean {
  const major1 = v1.split(".")[0];
  const major2 = v2.split(".")[0];
  return major1 === major2;
}

// ============================================================================
// Message Types
// ============================================================================

export type SyncMessageType =
  | "SYNC_REQUEST"
  | "SYNC_RESPONSE"
  | "SYNC_DATA"
  | "SYNC_ACK"
  | "SYNC_VERSION_MISMATCH";

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
  protocolVersion: string;
  lastSyncTime: number;
}

/**
 * Response from Device B with its changed data
 * Sent after receiving a SYNC_REQUEST
 */
export interface SyncResponse extends BaseSyncMessage {
  type: "SYNC_RESPONSE";
  protocolVersion: string;
  accounts: AccountRow[];
  transactions: Transaction[];
}

/**
 * Sent when protocol versions are incompatible
 * Receiving device should show an error and abort sync
 */
export interface SyncVersionMismatch extends BaseSyncMessage {
  type: "SYNC_VERSION_MISMATCH";
  localVersion: string;
  remoteVersion: string;
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

export type SyncMessage =
  | SyncRequest
  | SyncResponse
  | SyncData
  | SyncAck
  | SyncVersionMismatch;

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
    protocolVersion: SYNC_PROTOCOL_VERSION,
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
    protocolVersion: SYNC_PROTOCOL_VERSION,
    accounts,
    transactions,
  };
}

/**
 * Create a version mismatch message
 */
export function createSyncVersionMismatch(
  remoteVersion: string
): SyncVersionMismatch {
  return {
    type: "SYNC_VERSION_MISMATCH",
    timestamp: Date.now(),
    localVersion: SYNC_PROTOCOL_VERSION,
    remoteVersion,
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
      [
        "SYNC_REQUEST",
        "SYNC_RESPONSE",
        "SYNC_DATA",
        "SYNC_ACK",
        "SYNC_VERSION_MISMATCH",
      ].includes(data.type)
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
