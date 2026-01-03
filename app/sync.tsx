import { useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";

import { Text } from "@/components/text";
import { useNearbyConnections, type Peer } from "@/context/nearby-connections";
import { useSQLiteContext } from "@/db/provider";
import { useBackgroundAdvertising } from "@/hooks/useBackgroundAdvertising";
import { useSyncMachine } from "@/hooks/useSyncMachine";
import { useTheme } from "@/hooks/useTheme";
import { formatSyncResult } from "@/utils/format";

interface DeviceItem extends Peer {
  isConnected: boolean;
}

export default function SyncScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const nearbyConnections = useNearbyConnections();

  // Get the device name and advertising controls from the app-wide provider
  // Pause/resume are passed to useSyncMachine to ensure proper sequencing
  const { deviceName, pauseAdvertising, resumeAdvertising } =
    useBackgroundAdvertising();

  // Use the sync state machine (handles pause/resume advertising internally)
  const {
    isDiscovering,
    isSuccess,
    isError,
    syncStatus,
    syncingPeerId,
    mergeResult,
    lastError,
    startSync,
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

  // Show alert on sync success/error
  useEffect(() => {
    if (isSuccess && mergeResult) {
      Alert.alert(
        "Sync Complete",
        formatSyncResult(
          mergeResult.accountsMerged,
          mergeResult.transactionsMerged
        )
      );
    }
  }, [isSuccess, mergeResult]);

  useEffect(() => {
    if (isError && lastError) {
      Alert.alert("Sync Failed", lastError);
    }
  }, [isError, lastError]);

  const handleSync = useCallback(
    async (peer: Peer, isConnected: boolean) => {
      console.log(
        "[sync] Sync button pressed for:",
        peer.name,
        peer.peerId,
        "connected:",
        isConnected
      );

      try {
        await startSync(peer, isConnected);
      } catch (error) {
        console.error("Failed to sync:", error);
        Alert.alert("Error", `Failed to sync with ${peer.name}`);
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
            <Text
              style={{
                ...typography.calloutEmphasized,
                color: colors.labelPrimary,
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                ...typography.caption1Regular,
                color: colors.labelTertiary,
              }}
            >
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
              <Text
                style={{
                  ...typography.subheadlineEmphasized,
                  color: colors.white,
                }}
              >
                Sync
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [colors, radius, spacing, typography, syncStatus, syncingPeerId, handleSync]
  );

  return (
    <>
      <Stack.Header style={{ backgroundColor: colors.backgroundTertiary }}>
        <Stack.Header.Title style={{ color: colors.labelPrimary }}>
          Sync
        </Stack.Header.Title>
      </Stack.Header>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>
        {/* Device Info */}
        <View
          style={{
            padding: spacing.xl,
            gap: spacing.xs,
            backgroundColor: colors.backgroundTertiary,
            borderRadius: radius.lg,
          }}
        >
          <Text
            style={{
              ...typography.caption1Emphasized,
              textTransform: "uppercase",
              color: colors.labelSecondary,
            }}
          >
            This Device
          </Text>
          <Text
            style={{
              ...typography.title3Emphasized,
              color: colors.labelPrimary,
            }}
          >
            {deviceName}
          </Text>
          <Text
            style={{
              ...typography.caption1Regular,
              color: colors.labelTertiary,
            }}
          >
            Searching for nearby devices...
          </Text>
        </View>

        {/* Nearby Devices */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typography.caption1Emphasized,
              textTransform: "uppercase",
              color: colors.labelSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Nearby Devices ({devices.length})
          </Text>

          {devices.length === 0 ? (
            // Searching for devices
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: spacing.xxl,
              }}
            >
              <ActivityIndicator size="large" color={colors.blue} />
              <Text
                style={{
                  ...typography.bodyRegular,
                  color: colors.labelTertiary,
                  textAlign: "center",
                  marginTop: spacing.xl,
                }}
              >
                Looking for nearby devices...{"\n"}
                Make sure the other device has the app open.
              </Text>
            </View>
          ) : (
            // Devices found
            <FlatList
              data={devices}
              keyExtractor={(item) => item.peerId}
              renderItem={renderDeviceItem}
              contentContainerStyle={{ gap: spacing.sm }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Sync Status */}
        {syncStatus !== "idle" && (
          <View
            style={{
              padding: spacing.lg,
              alignItems: "center",
              backgroundColor:
                syncStatus === "success"
                  ? colors.green
                  : syncStatus === "error"
                  ? colors.red
                  : colors.blue,
              borderRadius: radius.md,
            }}
          >
            <Text style={{ ...typography.bodyEmphasized, color: colors.white }}>
              {syncStatus === "syncing" && "Syncing..."}
              {syncStatus === "success" && "Sync complete!"}
              {syncStatus === "error" && "Sync failed"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
