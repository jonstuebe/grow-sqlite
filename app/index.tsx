import { Link, Stack, useRouter } from "expo-router";
import { Toolbar } from "expo-router/unstable-toolbar";
import { SymbolView } from "expo-symbols";
import { ScrollView, View } from "react-native";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useAccounts, useArchivedAccounts, useTotalBalance } from "@/db/hooks";
import type { Account } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency, getProgress } from "@/utils/format";

/**
 * Account row component
 */
function AccountRow({ account }: { account: Account }) {
  const { colors, spacing, radius } = useTheme();
  const progress = getProgress(account.current_amount, account.target_amount);

  return (
    <Link href={`/${account.id}`} asChild>
      <Link.Trigger>
        <PressableGlass
          style={{
            position: "relative",
            flex: 1,
          }}
          glassProps={{
            style: {
              borderRadius: radius.xxl,
              overflow: "hidden",
            },
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${progress}%`,
              height: "100%",
              backgroundColor: colors.fillQuaternary,
            }}
          />
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
              <Text size="rowLabelTitle">{account.name}</Text>
              <Text size="rowLabelSubtitle" color="labelVibrantSecondary">
                {formatCurrency(account.current_amount)} of{" "}
                {formatCurrency(account.target_amount)}
              </Text>
            </View>
            <Text size="rowLabelSubtitle" color="labelVibrantSecondary">
              {Math.round(progress)}%
            </Text>
          </View>
        </PressableGlass>
      </Link.Trigger>
    </Link>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();

  const { data: totalBalance = 0 } = useTotalBalance();
  const { data: accounts = [] } = useAccounts();
  const { data: archivedAccounts = [] } = useArchivedAccounts();

  return (
    <>
      <Stack.Header
        style={{
          backgroundColor: colors.backgroundPrimary,
        }}
      >
        <Stack.Header.Title
          style={{ color: colors.labelPrimary, fontSize: 32 }}
        >
          {formatCurrency(totalBalance)}
        </Stack.Header.Title>
      </Stack.Header>

      <View
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            gap: spacing.md,
          }}
        >
          {accounts.map((account) => (
            <View
              key={account.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <AccountRow account={account} />
              <Link href={`/withdrawal?accountId=${account.id}`} asChild>
                <PressableGlass
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
                  <SymbolView name="minus" tintColor={colors.red} size={24} />
                </PressableGlass>
              </Link>
              <Link href={`/deposit?accountId=${account.id}`} asChild>
                <PressableGlass
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
                  <SymbolView name="plus" tintColor={colors.blue} size={24} />
                </PressableGlass>
              </Link>
            </View>
          ))}
        </ScrollView>
      </View>

      <Toolbar>
        {accounts.length >= 2 ? (
          <Toolbar.Button
            icon="arrow.up.arrow.down"
            onPress={() => router.push("/transfer")}
          />
        ) : null}
        {archivedAccounts.length > 0 ? (
          <Toolbar.Button
            icon="archivebox"
            onPress={() => router.push("/archived")}
          />
        ) : null}
        <Toolbar.Spacer sharesBackground={false} />
        <Toolbar.Button icon="plus" onPress={() => router.push("/new")} />
      </Toolbar>
    </>
  );
}
