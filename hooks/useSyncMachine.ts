/**
 * React hook for using the sync state machine
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
    advertise: (name: string) => Promise<void>;
    stopAdvertising: () => Promise<void>;
    discover: (name: string) => Promise<void>;
    stopDiscovering: () => Promise<void>;
    connect: (peerId: string) => Promise<void>;
    send: (peerId: string, data: string) => Promise<void>;
  };
}

export function useSyncMachine({
  deviceName,
  db,
  queryClient,
  nearbyConnections,
}: UseSyncMachineOptions) {
  const [state, send, actorRef] = useMachine(syncMachine, {
    input: { deviceName },
  });

  const {
    connectedPeers,
    receivedMessages,
    advertise,
    stopAdvertising,
    discover,
    stopDiscovering,
    connect,
    send: sendMessage,
  } = nearbyConnections;

  // Handle mode transitions - start/stop advertising/discovery
  useEffect(() => {
    const handleModeChange = async () => {
      if (state.matches("advertising")) {
        await stopDiscovering().catch(() => {});
        await advertise(deviceName).catch(console.error);
      } else if (state.matches("discovering")) {
        await stopAdvertising().catch(() => {});
        await discover(deviceName).catch(console.error);
      }
    };

    handleModeChange();
  }, [
    state.value,
    deviceName,
    advertise,
    stopAdvertising,
    discover,
    stopDiscovering,
  ]);

  // Watch for peer connections (for pending sync)
  useEffect(() => {
    const pendingPeerId = state.context.pendingSyncPeerId;
    if (pendingPeerId && state.matches({ syncing: "connecting" })) {
      const isConnected = connectedPeers.some((p) => p.peerId === pendingPeerId);
      if (isConnected) {
        send({ type: "PEER_CONNECTED", peerId: pendingPeerId });
      }
    }
  }, [connectedPeers, state.context.pendingSyncPeerId, state.value, send]);

  // Send SYNC_REQUEST when entering requesting state
  useEffect(() => {
    const sendRequest = async () => {
      if (state.matches({ syncing: "requesting" }) && state.context.syncingPeerId) {
        try {
          const request = createSyncRequest(0);
          await sendMessage(state.context.syncingPeerId, JSON.stringify(request));
        } catch (error) {
          send({
            type: "SYNC_ERROR",
            error: error instanceof Error ? error.message : "Failed to send sync request",
          });
        }
      }
    };

    sendRequest();
  }, [state.value, state.context.syncingPeerId, sendMessage, send]);

  // Handle responding state - send our data as response
  useEffect(() => {
    const sendResponse = async () => {
      if (state.matches({ syncing: "responding" }) && state.context.syncingPeerId) {
        try {
          const accounts = await getAllAccountRows(db);
          const transactions = await getAllTransactionRows(db);
          const response = createSyncResponse(accounts, transactions);
          await sendMessage(state.context.syncingPeerId, JSON.stringify(response));
        } catch (error) {
          send({
            type: "SYNC_ERROR",
            error: error instanceof Error ? error.message : "Failed to send sync response",
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
          // Only handle if we're in advertising state (ready to receive)
          if (state.matches("advertising")) {
            send({ type: "SYNC_REQUESTED", peerId });
          }
          break;
        }

        case "SYNC_RESPONSE": {
          if (state.matches({ syncing: "requesting" })) {
            // Merge their data
            const { accountsMerged, transactionsMerged } = await applySyncData(
              db,
              message.accounts,
              message.transactions
            );

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

            console.log(
              `Merged ${accountsMerged} accounts, ${transactionsMerged} transactions from response`
            );
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

            console.log(
              `Merged ${accountsMerged} accounts, ${transactionsMerged} transactions from data`
            );
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
      console.error("Error handling sync message:", error);
      send({
        type: "SYNC_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Action handlers
  const findDevices = useCallback(() => {
    send({ type: "FIND_DEVICES" });
  }, [send]);

  const stopFindingDevices = useCallback(() => {
    send({ type: "STOP_DISCOVERING" });
  }, [send]);

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
  const isAdvertising = state.matches("advertising");
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
    isAdvertising,
    isDiscovering,
    isSyncing,
    isSuccess,
    isError,
    syncStatus,
    syncingPeerId: state.context.syncingPeerId,
    mergeResult: state.context.mergeResult,
    lastError: state.context.lastError,

    // Actions
    findDevices,
    stopFindingDevices,
    startSync,
    reset,

    // Raw send for advanced usage
    send,
  };
}
