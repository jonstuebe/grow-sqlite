/**
 * React hook for using the sync state machine
 *
 * Note: Advertising is handled at the app level via BackgroundAdvertisingProvider.
 * This hook manages discovery and the sync protocol.
 */

import { useCallback, useEffect } from "react";
import { useMachine } from "@xstate/react";
import type { QueryClient } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";

import {
  getAllAccountRows,
  getAllTransactionRows,
  applySyncData,
} from "@/db/queries";
import {
  createSyncRequest,
  createSyncResponse,
  createSyncData,
  createSyncAck,
  parseSyncMessage,
  type SyncMessage,
} from "@/db/sync";
import type { Peer, ReceivedMessage } from "@/context/nearby-connections";

// Re-export types and machine from the pure definition file
export {
  syncMachine,
  type SyncContext,
  type SyncEvent,
  type MergeResult,
} from "./syncMachine";

import { syncMachine } from "./syncMachine";

// ============================================================================
// React Hook
// ============================================================================

export interface UseSyncMachineOptions {
  deviceName: string;
  db: SQLiteDatabase;
  queryClient: QueryClient;
  nearbyConnections: {
    connectedPeers: Peer[];
    receivedMessages: ReceivedMessage[];
    discover: (name: string) => Promise<void>;
    stopDiscovering: () => Promise<void>;
    connect: (peerId: string) => Promise<void>;
    send: (peerId: string, data: string) => Promise<void>;
  };
  /** Pause background advertising before starting discovery */
  pauseAdvertising: () => Promise<void>;
  /** Resume background advertising after stopping discovery */
  resumeAdvertising: () => Promise<void>;
}

export function useSyncMachine({
  deviceName,
  db,
  queryClient,
  nearbyConnections,
  pauseAdvertising,
  resumeAdvertising,
}: UseSyncMachineOptions) {
  const [state, send] = useMachine(syncMachine, {
    input: { deviceName },
  });

  const {
    connectedPeers,
    receivedMessages,
    discover,
    stopDiscovering,
    connect,
    send: sendMessage,
  } = nearbyConnections;

  // Manual discovery control functions
  const startDiscovery = useCallback(async () => {
    // First, pause advertising and wait for it to complete
    // CRITICAL: Must await pauseAdvertising before starting discovery due to expo-nearby-connections limitation
    await pauseAdvertising();

    // Start network discovery
    await discover(deviceName);

    // Update state machine
    send({ type: "START_DISCOVERY" });
  }, [deviceName, discover, pauseAdvertising, send]);

  const stopDiscovery = useCallback(async () => {
    // Stop network discovery first
    await stopDiscovering();

    // Resume advertising
    await resumeAdvertising();

    // Update state machine
    send({ type: "STOP_DISCOVERY" });
  }, [stopDiscovering, resumeAdvertising, send]);

  // Watch for peer connections (for pending sync)
  useEffect(() => {
    const pendingPeerId = state.context.pendingSyncPeerId;
    if (pendingPeerId && state.matches({ syncing: "connecting" })) {
      const isConnected = connectedPeers.some(
        (p) => p.peerId === pendingPeerId
      );
      if (isConnected) {
        send({ type: "PEER_CONNECTED", peerId: pendingPeerId });
      }
    }
  }, [connectedPeers, state.context.pendingSyncPeerId, state.value, send]);

  // Send SYNC_REQUEST when entering requesting state
  useEffect(() => {
    const sendRequest = async () => {
      if (
        state.matches({ syncing: "requesting" }) &&
        state.context.syncingPeerId
      ) {
        try {
          const request = createSyncRequest(0);
          await sendMessage(
            state.context.syncingPeerId,
            JSON.stringify(request)
          );
        } catch (error) {
          send({
            type: "SYNC_ERROR",
            error:
              error instanceof Error
                ? error.message
                : "Failed to send sync request",
          });
        }
      }
    };

    sendRequest();
  }, [state.value, state.context.syncingPeerId, sendMessage, send]);

  // Handle responding state - send our data as response
  useEffect(() => {
    const sendResponse = async () => {
      if (
        state.matches({ syncing: "responding" }) &&
        state.context.syncingPeerId
      ) {
        try {
          const accounts = await getAllAccountRows(db);
          const transactions = await getAllTransactionRows(db);
          const response = createSyncResponse(accounts, transactions);
          await sendMessage(
            state.context.syncingPeerId,
            JSON.stringify(response)
          );
        } catch (error) {
          send({
            type: "SYNC_ERROR",
            error:
              error instanceof Error
                ? error.message
                : "Failed to send sync response",
          });
        }
      }
    };

    sendResponse();
  }, [state.value, state.context.syncingPeerId, db, sendMessage, send]);

  // Process incoming sync messages
  useEffect(() => {
    if (receivedMessages.length === 0) return;

    const lastMessage = receivedMessages[receivedMessages.length - 1];
    const syncMessage = parseSyncMessage(lastMessage.text);

    if (!syncMessage) return;

    handleSyncMessage(lastMessage.peerId, syncMessage);
  }, [receivedMessages]);

  const handleSyncMessage = async (peerId: string, message: SyncMessage) => {
    try {
      switch (message.type) {
        case "SYNC_REQUEST": {
          // Handle if we're in discovering state (ready to receive)
          if (state.matches("discovering")) {
            send({ type: "SYNC_REQUESTED", peerId });
          }
          break;
        }

        case "SYNC_RESPONSE": {
          if (state.matches({ syncing: "requesting" })) {
            // Merge their data
            await applySyncData(db, message.accounts, message.transactions);

            // Send our data back
            const accounts = await getAllAccountRows(db);
            const transactions = await getAllTransactionRows(db);
            const syncData = createSyncData(accounts, transactions);
            await sendMessage(peerId, JSON.stringify(syncData));

            // Invalidate queries to refresh UI
            await queryClient.invalidateQueries();

            // Transition to awaiting ack
            send({
              type: "SYNC_RESPONSE_RECEIVED",
              peerId,
              accounts: message.accounts,
              transactions: message.transactions,
            });
          }
          break;
        }

        case "SYNC_DATA": {
          if (state.matches({ syncing: "responding" })) {
            // Merge their data and send ack
            const { accountsMerged, transactionsMerged } = await applySyncData(
              db,
              message.accounts,
              message.transactions
            );

            const ack = createSyncAck(true, accountsMerged, transactionsMerged);
            await sendMessage(peerId, JSON.stringify(ack));

            // Invalidate queries to refresh UI
            await queryClient.invalidateQueries();

            // Transition to success
            send({
              type: "SYNC_DATA_RECEIVED",
              peerId,
              accounts: message.accounts,
              transactions: message.transactions,
            });

            // Manually trigger success since we completed
            setTimeout(() => {
              send({
                type: "SYNC_ACK_RECEIVED",
                success: true,
                accountsMerged,
                transactionsMerged,
              });
            }, 100);
          }
          break;
        }

        case "SYNC_ACK": {
          send({
            type: "SYNC_ACK_RECEIVED",
            success: message.success,
            accountsMerged: message.accountsMerged,
            transactionsMerged: message.transactionsMerged,
            error: message.error,
          });
          break;
        }
      }
    } catch (error) {
      send({
        type: "SYNC_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Action handlers
  const startSync = useCallback(
    async (peer: Peer, isConnected: boolean) => {
      if (isConnected) {
        // Already connected - send sync request directly
        send({ type: "START_SYNC", peerId: peer.peerId });
        // Immediately promote to syncing since already connected
        setTimeout(() => {
          send({ type: "PEER_CONNECTED", peerId: peer.peerId });
        }, 0);
      } else {
        // Need to connect first
        send({ type: "START_SYNC", peerId: peer.peerId });
        try {
          await connect(peer.peerId);
        } catch (error) {
          send({
            type: "CONNECTION_FAILED",
            error: error instanceof Error ? error.message : "Connection failed",
          });
        }
      }
    },
    [send, connect]
  );

  const reset = useCallback(() => {
    send({ type: "RESET" });
  }, [send]);

  // Derived state for easy consumption
  const isIdle = state.matches("idle");
  const isDiscovering = state.matches("discovering");
  const isSyncing = state.matches("syncing");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");

  const syncStatus = isSyncing
    ? "syncing"
    : isSuccess
    ? "success"
    : isError
    ? "error"
    : "idle";

  return {
    // State
    state,
    context: state.context,

    // Derived state
    isIdle,
    isDiscovering,
    isSyncing,
    isSuccess,
    isError,
    syncStatus,
    syncingPeerId: state.context.syncingPeerId,
    mergeResult: state.context.mergeResult,
    lastError: state.context.lastError,

    // Actions
    startDiscovery,
    stopDiscovery,
    startSync,
    reset,

    // Raw send for advanced usage
    send,
  };
}
