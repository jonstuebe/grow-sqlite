import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useArchivedAccounts, useUnarchiveAccount } from "@/db/hooks";
import type { Account } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";

function ArchivedAccountRow({
  account,
  onUnarchive,
}: {
  account: Account;
  onUnarchive: (account: Account) => void;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <PressableGlass
        style={{ flex: 1 }}
        glassProps={{
          style: {
            borderRadius: radius.xxl,
            overflow: "hidden",
          },
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View>
            <Text variant="rowLabelTitle">{account.name}</Text>
            <Text variant="rowLabelSubtitle" color="labelVibrantSecondary">
              {formatCurrency(account.current_amount)}
            </Text>
          </View>
        </View>
      </PressableGlass>

      <PressableGlass
        onPress={() => onUnarchive(account)}
        glassProps={{
          style: {
            borderRadius: radius.circle,
            padding: spacing.sm,
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <SymbolView
          name="arrow.uturn.backward"
          tintColor={colors.blue}
          size={24}
        />
      </PressableGlass>
    </View>
  );
}

export default function ArchivedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const { data: archivedAccounts = [], isLoading } = useArchivedAccounts();
  const unarchiveAccount = useUnarchiveAccount();

  const handleUnarchive = (account: Account) => {
    Alert.alert(
      "Restore Account",
      `Are you sure you want to restore "${account.name}"? This will move it back to your accounts list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              await unarchiveAccount.mutateAsync(account.id);
              // If no more archived accounts, go back
              if (archivedAccounts.length === 1) {
                router.back();
              }
            } catch (error) {
              console.error("Failed to restore account:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Header
        style={{
          backgroundColor: colors.backgroundTertiary,
        }}
      >
        <Stack.Header.Left>
          <Stack.Header.Button icon="xmark" onPress={() => router.back()} />
        </Stack.Header.Left>
        <Stack.Header.Title style={{ color: colors.labelPrimary }}>
          Archived Accounts
        </Stack.Header.Title>
      </Stack.Header>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.md,
        }}
      >
        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text>Loading...</Text>
          </View>
        ) : archivedAccounts.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.xxxl,
            }}
          >
            <SymbolView
              name="archivebox"
              tintColor={colors.labelTertiary}
              size={48}
            />
            <Text
              variant="bodyRegular"
              color="labelVibrantSecondary"
              style={{ marginTop: spacing.lg }}
            >
              No archived accounts
            </Text>
          </View>
        ) : (
          archivedAccounts.map((account) => (
            <ArchivedAccountRow
              key={account.id}
              account={account}
              onUnarchive={handleUnarchive}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}
