import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

import { Text } from "@/components/text";
import { useNearbyConnections, type Peer } from "@/context/nearby-connections";
import { useSQLiteContext } from "@/db/provider";
import { useBackgroundAdvertising } from "@/hooks/useBackgroundAdvertising";
import { useSyncMachine } from "@/hooks/useSyncMachine";
import { useTheme } from "@/hooks/useTheme";
import { formatSyncResult } from "@/utils/format";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DeviceItem extends Peer {
  isConnected: boolean;
}

export default function SyncScreen() {
  const { colors, spacing, radius } = useTheme();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const nearbyConnections = useNearbyConnections();
  const insets = useSafeAreaInsets();

  // Get the device name and advertising controls from the app-wide provider
  // Pause/resume are passed to useSyncMachine to ensure proper sequencing
  const { deviceName, pauseAdvertising, resumeAdvertising } =
    useBackgroundAdvertising();

  // Use the sync state machine (handles pause/resume advertising internally)
  const {
    syncStatus,
    syncingPeerId,
    mergeResult,
    lastError,
    isDiscovering,
    startSync,
    startDiscovery,
    stopDiscovery,
  } = useSyncMachine({
    deviceName,
    db,
    queryClient,
    nearbyConnections,
    pauseAdvertising,
    resumeAdvertising,
  });

  const {
    discoveredPeers,
    connectedPeers,
    pendingInvitation,
    acceptInvitation,
  } = nearbyConnections;

  // Combine discovered and connected peers into a unified list
  const devices = useMemo<DeviceItem[]>(() => {
    const connectedIds = new Set(connectedPeers.map((p) => p.peerId));
    const connectedNames = new Set(connectedPeers.map((p) => p.name));

    // Start with connected peers (marked as connected)
    const connected: DeviceItem[] = connectedPeers.map((p) => ({
      ...p,
      isConnected: true,
    }));

    // Add discovered peers that aren't already connected (by ID or name)
    // This handles the case where a device may have different peer IDs
    // for advertising vs discovery
    const discovered: DeviceItem[] = discoveredPeers
      .filter((p) => !connectedIds.has(p.peerId) && !connectedNames.has(p.name))
      .map((p) => ({
        ...p,
        isConnected: false,
      }));

    return [...connected, ...discovered];
  }, [discoveredPeers, connectedPeers]);

  // Show alert for incoming connection invitations
  useEffect(() => {
    if (pendingInvitation) {
      Alert.alert(
        "Connection Request",
        `${pendingInvitation.name} wants to sync`,
        [
          {
            text: "Decline",
            style: "cancel",
          },
          {
            text: "Accept",
            onPress: () => acceptInvitation(),
          },
        ]
      );
    }
  }, [pendingInvitation, acceptInvitation]);

  // Track the previous sync status to detect transitions
  const prevSyncStatusRef = useRef(syncStatus);

  // Show toast notifications for sync status changes
  useEffect(() => {
    const prevStatus = prevSyncStatusRef.current;
    prevSyncStatusRef.current = syncStatus;

    // Only show toast on status transitions, not on initial render
    if (prevStatus === syncStatus) return;

    if (syncStatus === "syncing") {
      toast.loading("Syncing...", { id: "sync-toast" });
    } else if (syncStatus === "success" && mergeResult) {
      toast.success("Sync complete!", {
        id: "sync-toast",
        description: formatSyncResult(
          mergeResult.accountsMerged,
          mergeResult.transactionsMerged
        ),
      });
    } else if (syncStatus === "error" && lastError) {
      toast.error("Sync failed", {
        id: "sync-toast",
        description: lastError,
      });
    } else if (syncStatus === "idle" && prevStatus !== "idle") {
      // Dismiss the toast when returning to idle (after success/error auto-reset)
      toast.dismiss("sync-toast");
    }
  }, [syncStatus, mergeResult, lastError]);

  const handleSync = useCallback(
    async (peer: Peer, isConnected: boolean) => {
      try {
        await startSync(peer, isConnected);
      } catch (error) {
        toast.error("Error", {
          description: `Failed to sync with ${peer.name}`,
        });
      }
    },
    [startSync]
  );

  const renderDeviceItem = useCallback(
    ({ item }: { item: DeviceItem }) => {
      const isSyncingThisPeer =
        syncingPeerId === item.peerId && syncStatus === "syncing";

      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: spacing.lg,
            backgroundColor: colors.backgroundTertiary,
            borderRadius: radius.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <Text variant="calloutEmphasized" color="labelPrimary">
              {item.name}
            </Text>
            <Text variant="caption1Regular" color="labelTertiary">
              {item.isConnected ? "Connected" : "Nearby"}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radius.lg,
              minWidth: 80,
              alignItems: "center",
              backgroundColor: colors.blue,
            }}
            onPress={() => handleSync(item, item.isConnected)}
            disabled={isSyncingThisPeer}
          >
            {isSyncingThisPeer ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text variant="subheadlineEmphasized" color="white">
                Sync
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [colors, radius, spacing, syncStatus, syncingPeerId, handleSync]
  );

  return (
    <>
      <View
        style={{
          flex: 1,
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.lg,
        }}
      >
        {/* Device Info */}
        <View
          style={{
            padding: spacing.lg,
            gap: spacing.xxs,
            backgroundColor: colors.backgroundTertiary,
            borderRadius: radius.xxxl,
          }}
        >
          <Text
            variant="caption1Emphasized"
            color="labelSecondary"
            style={{ textTransform: "uppercase" }}
          >
            This Device
          </Text>
          <Text variant="rowLabelTitle" color="labelPrimary">
            {deviceName}
          </Text>
        </View>

        {/* Nearby Devices */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Text
            variant="caption1Emphasized"
            color="labelSecondary"
            style={{ textTransform: "uppercase", marginBottom: spacing.sm }}
          >
            Nearby Devices ({devices.length})
          </Text>

          {devices.length === 0 ? (
            // Empty state
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: spacing.xxl,
              }}
            >
              {isDiscovering ? (
                <View
                  style={{
                    flexDirection: "column",
                    gap: spacing.sm,
                  }}
                >
                  <ActivityIndicator size="small" />
                  <Text
                    variant="calloutRegular"
                    color="labelSecondary"
                    style={{ textAlign: "center" }}
                  >
                    Looking for nearby devices...{"\n"}
                    Make sure the other device has the app open.
                  </Text>
                </View>
              ) : (
                <Text
                  variant="bodyRegular"
                  color="labelSecondary"
                  style={{ textAlign: "center" }}
                >
                  Start discovery to find nearby devices.{"\n"}
                  Make sure the other device has the app open.
                </Text>
              )}
            </View>
          ) : (
            // Devices found
            <FlatList
              data={devices}
              keyExtractor={(item) => item.peerId}
              renderItem={renderDeviceItem}
              contentContainerStyle={{ gap: spacing.sm }}
            />
          )}
        </View>

        {/* Discovery Toggle Button */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.blue,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            alignItems: "center",
          }}
          onPress={isDiscovering ? stopDiscovery : startDiscovery}
        >
          <Text variant="bodyEmphasized" color="white">
            {isDiscovering ? "Stop Discovery" : "Start Discovery"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
