import { useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSyncMachine } from "@/hooks/useSyncMachine";
import { useTheme } from "@/hooks/useTheme";
import { generateDeviceName } from "@/utils/device-name";

interface DeviceItem extends Peer {
  isConnected: boolean;
}

export default function SyncScreen() {
  const { colors, spacing, radius } = useTheme();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const nearbyConnections = useNearbyConnections();

  // Generate a fun device name on mount
  const [deviceName] = useState(() => generateDeviceName());

  // Use the sync state machine
  const {
    isAdvertising,
    isDiscovering,
    isSyncing,
    isSuccess,
    isError,
    syncStatus,
    syncingPeerId,
    mergeResult,
    lastError,
    findDevices,
    startSync,
  } = useSyncMachine({
    deviceName,
    db,
    queryClient,
    nearbyConnections,
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

    // Start with connected peers (marked as connected)
    const connected: DeviceItem[] = connectedPeers.map((p) => ({
      ...p,
      isConnected: true,
    }));

    // Add discovered peers that aren't already connected
    const discovered: DeviceItem[] = discoveredPeers
      .filter((p) => !connectedIds.has(p.peerId))
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
        `Synced ${mergeResult.accountsMerged} accounts and ${mergeResult.transactionsMerged} transactions`
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
            padding: 12,
            backgroundColor: colors.backgroundTertiary,
            borderRadius: radius.md,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: colors.labelPrimary,
              }}
            >
              {item.name}
            </Text>
            <Text style={{ color: colors.labelTertiary, fontSize: 12 }}>
              {item.isConnected ? "Connected" : "Nearby"}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 8,
              minWidth: 80,
              alignItems: "center",
              backgroundColor: colors.blue,
            }}
            onPress={() => handleSync(item, item.isConnected)}
            disabled={isSyncingThisPeer}
          >
            {isSyncingThisPeer ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                Sync
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [colors, radius, syncStatus, syncingPeerId, handleSync]
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
            padding: 16,
            gap: 4,
            backgroundColor: colors.backgroundTertiary,
            borderRadius: radius.lg,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              color: colors.labelSecondary,
            }}
          >
            This Device
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.labelPrimary,
            }}
          >
            {deviceName}
          </Text>
          <Text style={{ color: colors.labelTertiary, fontSize: 12 }}>
            {isDiscovering
              ? "Searching for devices..."
              : "Ready to receive sync requests"}
          </Text>
        </View>

        {/* Nearby Devices */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              color: colors.labelSecondary,
              marginBottom: spacing.sm,
            }}
          >
            {isDiscovering ? `Nearby Devices (${devices.length})` : "Sync"}
          </Text>

          {isAdvertising ? (
            // Receiver mode - show button to find devices
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
                gap: 16,
              }}
            >
              <Text
                style={{ color: colors.labelTertiary, textAlign: "center" }}
              >
                Ready to receive sync requests.{"\n"}
                Or tap below to find other devices.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.blue,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
                onPress={findDevices}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
                >
                  Find Devices
                </Text>
              </TouchableOpacity>
            </View>
          ) : devices.length === 0 ? (
            // Initiator mode - searching
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
              }}
            >
              <ActivityIndicator size="large" color={colors.blue} />
              <Text
                style={{
                  color: colors.labelTertiary,
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                Searching for nearby devices...{"\n"}
                Make sure the other device has the Sync screen open.
              </Text>
            </View>
          ) : (
            // Initiator mode - devices found
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
              padding: 12,
              alignItems: "center",
              backgroundColor:
                syncStatus === "success"
                  ? "#34C759"
                  : syncStatus === "error"
                  ? "#FF3B30"
                  : colors.blue,
              borderRadius: radius.md,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
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
