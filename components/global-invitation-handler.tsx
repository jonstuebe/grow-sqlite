/**
 * Global handler for incoming sync invitations and background sync
 * Shows an alert when an invitation is received, handles sync protocol without navigation
 */

import { useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useNearbyConnections } from "@/context/nearby-connections";
import { useSQLiteContext } from "@/db/provider";
import {
  getAllAccountRows,
  getAllTransactionRows,
  applySyncData,
} from "@/db/queries";
import {
  parseSyncMessage,
  createSyncResponse,
  createSyncAck,
  type SyncMessage,
} from "@/db/sync";
import { formatSyncResult } from "@/utils/format";

export function GlobalInvitationHandler() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const {
    pendingInvitation,
    acceptInvitation,
    rejectInvitation,
    receivedMessages,
    send,
  } = useNearbyConnections();

  // Track if we're currently showing an alert to prevent duplicates
  const isShowingAlertRef = useRef(false);
  // Track the peer we accepted an invitation from (for sync handling)
  const acceptedPeerIdRef = useRef<string | null>(null);
  // Track if sync is in progress
  const isSyncingRef = useRef(false);

  // Handle incoming sync messages for background sync (receiver role)
  const handleSyncMessage = useCallback(
    async (peerId: string, message: SyncMessage) => {
      // Only handle if this is from the peer we accepted
      if (peerId !== acceptedPeerIdRef.current) return;

      try {
        switch (message.type) {
          case "SYNC_REQUEST": {
            // Send our data as response
            const accounts = await getAllAccountRows(db);
            const transactions = await getAllTransactionRows(db);
            const response = createSyncResponse(accounts, transactions);
            await send(peerId, JSON.stringify(response));
            break;
          }

          case "SYNC_DATA": {
            // Merge their data
            const { accountsMerged, transactionsMerged } = await applySyncData(
              db,
              message.accounts,
              message.transactions
            );

            // Send ack
            const ack = createSyncAck(true, accountsMerged, transactionsMerged);
            await send(peerId, JSON.stringify(ack));

            // Invalidate queries to refresh UI
            await queryClient.invalidateQueries();

            // Show success feedback
            Alert.alert(
              "Sync Complete",
              formatSyncResult(accountsMerged, transactionsMerged),
              [{ text: "OK" }]
            );

            // Reset state
            acceptedPeerIdRef.current = null;
            isSyncingRef.current = false;
            break;
          }
        }
      } catch {
        acceptedPeerIdRef.current = null;
        isSyncingRef.current = false;
      }
    },
    [db, queryClient, send]
  );

  // Process incoming messages
  useEffect(() => {
    if (receivedMessages.length === 0 || !acceptedPeerIdRef.current) return;

    const lastMessage = receivedMessages[receivedMessages.length - 1];
    const syncMessage = parseSyncMessage(lastMessage.text);

    if (!syncMessage) return;

    handleSyncMessage(lastMessage.peerId, syncMessage);
  }, [receivedMessages, handleSyncMessage]);

  // Handle invitation alert
  useEffect(() => {
    if (pendingInvitation && !isShowingAlertRef.current) {
      isShowingAlertRef.current = true;

      Alert.alert(
        "Sync Request",
        `${pendingInvitation.name} wants to sync data with you`,
        [
          {
            text: "Decline",
            style: "cancel",
            onPress: () => {
              rejectInvitation();
              isShowingAlertRef.current = false;
            },
          },
          {
            text: "Accept",
            onPress: async () => {
              // Store the peer ID to handle their sync messages
              acceptedPeerIdRef.current = pendingInvitation.peerId;
              isSyncingRef.current = true;
              // Accept the invitation (sync will happen via message handlers)
              await acceptInvitation();
              isShowingAlertRef.current = false;
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [pendingInvitation, acceptInvitation, rejectInvitation]);

  // This component doesn't render anything
  return null;
}
