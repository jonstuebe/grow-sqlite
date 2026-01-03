/**
 * XState machine definition for sync flow
 * This file contains only the pure machine definition without React dependencies
 * for easier testing.
 */

import { setup, assign } from "xstate";

// ============================================================================
// Types
// ============================================================================

export interface MergeResult {
  accountsMerged: number;
  transactionsMerged: number;
}

export interface SyncContext {
  deviceName: string;
  syncingPeerId: string | null;
  pendingSyncPeerId: string | null;
  lastError: string | null;
  mergeResult: MergeResult | null;
  /** Track previous mode to return to after sync */
  previousMode: "advertising" | "discovering";
}

/** Account row type for sync messages */
export interface AccountRow {
  id: string;
  name: string;
  target_amount: number;
  goal_enabled: number;
  archived_at: number | null;
  created_at: number;
  updated_at: number;
}

/** Transaction type for sync messages */
export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "transfer";
  related_account_id: string | null;
  created_at: number;
  updated_at: number;
}

// Events
export type SyncEvent =
  | { type: "FIND_DEVICES" }
  | { type: "STOP_DISCOVERING" }
  | { type: "START_SYNC"; peerId: string }
  | { type: "SYNC_REQUESTED"; peerId: string }
  | { type: "PEER_CONNECTED"; peerId: string }
  | { type: "CONNECTION_FAILED"; error: string }
  | {
      type: "SYNC_RESPONSE_RECEIVED";
      peerId: string;
      accounts: AccountRow[];
      transactions: Transaction[];
    }
  | {
      type: "SYNC_DATA_RECEIVED";
      peerId: string;
      accounts: AccountRow[];
      transactions: Transaction[];
    }
  | {
      type: "SYNC_ACK_RECEIVED";
      success: boolean;
      accountsMerged: number;
      transactionsMerged: number;
      error?: string;
    }
  | { type: "SYNC_ERROR"; error: string }
  | { type: "RESET" };

// ============================================================================
// Machine Definition
// ============================================================================

export interface SyncInput {
  deviceName: string;
}

export const syncMachine = setup({
  types: {
    context: {} as SyncContext,
    events: {} as SyncEvent,
    input: {} as SyncInput,
  },
  actions: {
    assignSyncingPeer: assign({
      syncingPeerId: (_, params: { peerId: string }) => params.peerId,
    }),
    assignPendingSyncPeer: assign({
      pendingSyncPeerId: (_, params: { peerId: string }) => params.peerId,
    }),
    clearPendingSyncPeer: assign({
      pendingSyncPeerId: () => null,
    }),
    promotePendingToSyncing: assign({
      syncingPeerId: ({ context }) => context.pendingSyncPeerId,
      pendingSyncPeerId: () => null,
    }),
    clearSyncingPeer: assign({
      syncingPeerId: () => null,
    }),
    assignError: assign({
      lastError: (_, params: { error: string }) => params.error,
    }),
    clearError: assign({
      lastError: () => null,
    }),
    assignMergeResult: assign({
      mergeResult: (
        _,
        params: { accountsMerged: number; transactionsMerged: number }
      ) => ({
        accountsMerged: params.accountsMerged,
        transactionsMerged: params.transactionsMerged,
      }),
    }),
    clearMergeResult: assign({
      mergeResult: () => null,
    }),
    savePreviousModeAdvertising: assign({
      previousMode: () => "advertising" as const,
    }),
    savePreviousModeDiscovering: assign({
      previousMode: () => "discovering" as const,
    }),
  },
  guards: {
    hasPendingSyncPeer: ({ context }) => context.pendingSyncPeerId !== null,
    isPendingPeer: ({ context, event }) => {
      if (event.type !== "PEER_CONNECTED") return false;
      return context.pendingSyncPeerId === event.peerId;
    },
  },
}).createMachine({
  id: "sync",
  initial: "advertising",
  context: ({ input }) => ({
    deviceName: input.deviceName,
    syncingPeerId: null,
    pendingSyncPeerId: null,
    lastError: null,
    mergeResult: null,
    previousMode: "advertising" as const,
  }),
  states: {
    advertising: {
      on: {
        FIND_DEVICES: {
          target: "discovering",
        },
        START_SYNC: {
          target: "syncing.connecting",
          actions: [
            { type: "savePreviousModeAdvertising" },
            {
              type: "assignPendingSyncPeer",
              params: ({ event }) => ({ peerId: event.peerId }),
            },
          ],
        },
        SYNC_REQUESTED: {
          target: "syncing.responding",
          actions: [
            { type: "savePreviousModeAdvertising" },
            {
              type: "assignSyncingPeer",
              params: ({ event }) => ({ peerId: event.peerId }),
            },
          ],
        },
      },
    },

    discovering: {
      on: {
        STOP_DISCOVERING: {
          target: "advertising",
        },
        START_SYNC: {
          target: "syncing.connecting",
          actions: [
            { type: "savePreviousModeDiscovering" },
            {
              type: "assignPendingSyncPeer",
              params: ({ event }) => ({ peerId: event.peerId }),
            },
          ],
        },
      },
    },

    syncing: {
      initial: "connecting",
      states: {
        /** Waiting for connection to be established (initiator only) */
        connecting: {
          on: {
            PEER_CONNECTED: {
              target: "requesting",
              guard: "isPendingPeer",
              actions: ["promotePendingToSyncing"],
            },
            CONNECTION_FAILED: {
              target: "#sync.error",
              actions: [
                "clearPendingSyncPeer",
                {
                  type: "assignError",
                  params: ({ event }) => ({ error: event.error }),
                },
              ],
            },
          },
        },

        /** Sent SYNC_REQUEST, waiting for SYNC_RESPONSE (initiator) */
        requesting: {},

        /** Received SYNC_REQUEST, need to send SYNC_RESPONSE (receiver) */
        responding: {},

        /** Processing received SYNC_RESPONSE and sending SYNC_DATA (initiator) */
        processingResponse: {},

        /** Processing received SYNC_DATA and sending SYNC_ACK (receiver) */
        processingData: {},

        /** Waiting for SYNC_ACK (initiator) */
        awaitingAck: {},
      },
      on: {
        SYNC_RESPONSE_RECEIVED: {
          target: ".processingResponse",
        },
        SYNC_DATA_RECEIVED: {
          target: ".processingData",
        },
        SYNC_ACK_RECEIVED: [
          {
            target: "success",
            guard: ({ event }) => event.success,
            actions: [
              {
                type: "assignMergeResult",
                params: ({ event }) => ({
                  accountsMerged: event.accountsMerged,
                  transactionsMerged: event.transactionsMerged,
                }),
              },
            ],
          },
          {
            target: "error",
            actions: [
              {
                type: "assignError",
                params: ({ event }) => ({ error: event.error ?? "Sync failed" }),
              },
            ],
          },
        ],
        SYNC_ERROR: {
          target: "error",
          actions: [
            {
              type: "assignError",
              params: ({ event }) => ({ error: event.error }),
            },
          ],
        },
      },
    },

    success: {
      after: {
        2000: [
          {
            target: "discovering",
            guard: ({ context }) => context.previousMode === "discovering",
            actions: ["clearSyncingPeer", "clearMergeResult"],
          },
          {
            target: "advertising",
            actions: ["clearSyncingPeer", "clearMergeResult"],
          },
        ],
      },
      on: {
        RESET: [
          {
            target: "discovering",
            guard: ({ context }) => context.previousMode === "discovering",
            actions: ["clearSyncingPeer", "clearMergeResult"],
          },
          {
            target: "advertising",
            actions: ["clearSyncingPeer", "clearMergeResult"],
          },
        ],
      },
    },

    error: {
      after: {
        2000: [
          {
            target: "discovering",
            guard: ({ context }) => context.previousMode === "discovering",
            actions: ["clearSyncingPeer", "clearError"],
          },
          {
            target: "advertising",
            actions: ["clearSyncingPeer", "clearError"],
          },
        ],
      },
      on: {
        RESET: [
          {
            target: "discovering",
            guard: ({ context }) => context.previousMode === "discovering",
            actions: ["clearSyncingPeer", "clearError"],
          },
          {
            target: "advertising",
            actions: ["clearSyncingPeer", "clearError"],
          },
        ],
      },
    },
  },
});

