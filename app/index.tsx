import { Link, Stack, useRouter } from "expo-router";
import { Toolbar } from "expo-router/unstable-toolbar";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, ScrollView, View } from "react-native";

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
              <Text variant="rowLabelTitle">{account.name}</Text>
              <Text variant="rowLabelSubtitle" color="labelVibrantSecondary">
                {formatCurrency(account.current_amount)} of{" "}
                {formatCurrency(account.target_amount)}
              </Text>
            </View>
            <Text variant="rowLabelSubtitle" color="labelVibrantSecondary">
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

  const { data: totalBalance = 0, isLoading: isLoadingBalance } =
    useTotalBalance();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: archivedAccounts = [] } = useArchivedAccounts();

  const isLoading = isLoadingBalance || isLoadingAccounts;

  return (
    <>
      <Stack.Header
        hidden={isLoading || accounts.length === 0}
        style={{
          backgroundColor: colors.backgroundPrimary,
        }}
      >
        <Stack.Header.Title
          style={{ color: colors.labelPrimary, fontSize: 32 }}
        >
          {formatCurrency(totalBalance)}
        </Stack.Header.Title>
        <Stack.Header.Right>
          <Stack.Header.Button
            icon="arrow.2.circlepath"
            onPress={() => router.push("/sync")}
          />
        </Stack.Header.Right>
      </Stack.Header>

      <View
        style={{
          flex: 1,
        }}
      >
        {isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color={colors.labelSecondary} />
          </View>
        ) : accounts.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              gap: spacing.md,
            }}
          >
            <SymbolView name="leaf.fill" tintColor={colors.green} size={64} />
            <Text
              variant="title2Emphasized"
              style={{ textAlign: "center", marginTop: spacing.md }}
            >
              Start Growing
            </Text>
            <Text
              variant="bodyRegular"
              color="labelVibrantSecondary"
              style={{ textAlign: "center" }}
            >
              Create your first savings goal to begin tracking your progress.
            </Text>
            <Link href="/new" asChild>
              <PressableGlass
                glassProps={{
                  tintColor: colors.blue,
                  style: {
                    borderRadius: radius.xxl,
                    paddingVertical: spacing.lg,
                    paddingHorizontal: spacing.xl,
                    marginTop: spacing.lg,
                  },
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <SymbolView name="plus" tintColor={colors.white} size={20} />
                  <Text variant="bodyEmphasized" color="white">
                    Create Goal
                  </Text>
                </View>
              </PressableGlass>
            </Link>
            <Link href="/import" asChild>
              <PressableGlass
                glassProps={{
                  style: {
                    borderRadius: radius.xxl,
                    paddingVertical: spacing.lg,
                    paddingHorizontal: spacing.xl,
                  },
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <SymbolView
                    name="square.and.arrow.down"
                    tintColor={colors.labelVibrantSecondary}
                    size={20}
                  />
                  <Text variant="bodyEmphasized" color="labelVibrantSecondary">
                    Import Backup
                  </Text>
                </View>
              </PressableGlass>
            </Link>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              flex: 1,
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.lg,
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
        )}
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
