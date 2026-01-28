import { Link, Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useAccounts, useArchivedAccounts, useTotalBalance } from "@/db/hooks";
import type { Account } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency, getProgress } from "@/utils/format";
import { GlassView } from "expo-glass-effect";

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
              width: `${Math.min(progress, 100)}%`,
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
                {formatCurrency(account.current_amount)}
                {account.goal_enabled &&
                  ` of ${formatCurrency(account.target_amount)}`}
              </Text>
            </View>
            {account.goal_enabled ? (
              <Text variant="rowLabelSubtitle" color="labelVibrantSecondary">
                {Math.round(progress)}%
              </Text>
            ) : null}
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
  const isOnboarding = accounts.length === 0 && archivedAccounts.length === 0;

  return (
    <ScrollView
      scrollEnabled={!isOnboarding}
      style={{
        flex: 1,
      }}
      contentContainerStyle={{
        flexGrow: 1,
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
        <View
          style={{
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
              <GlassView
                isInteractive
                style={{
                  flexDirection: "row",
                  gap: spacing.lg + 4,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.xxl,
                  paddingHorizontal: spacing.lg + 4,
                }}
              >
                <Link href={`/withdrawal?accountId=${account.id}`} asChild>
                  <Pressable>
                    <SymbolView name="minus" tintColor={colors.red} size={24} />
                  </Pressable>
                </Link>
                <View
                  style={{
                    width: 1,
                    height: 24,
                    backgroundColor: colors.labelTertiary,
                  }}
                />
                <Link href={`/deposit?accountId=${account.id}`} asChild>
                  <Pressable>
                    <SymbolView name="plus" tintColor={colors.blue} size={24} />
                  </Pressable>
                </Link>
              </GlassView>
            </View>
          ))}
        </View>
      )}

      <Stack.Header
        hidden={isLoading || isOnboarding}
        style={{
          backgroundColor: colors.backgroundPrimary,
        }}
      />
      {isLoading || isOnboarding ? null : (
        <Stack.Screen.Title
          style={{ color: colors.labelPrimary, fontSize: 32 }}
        >
          {formatCurrency(totalBalance)}
        </Stack.Screen.Title>
      )}
      {isLoading || isOnboarding ? null : (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="arrow.2.circlepath"
              onPress={() => router.push("/sync")}
            />
          </Stack.Toolbar>
          <Stack.Toolbar placement="bottom">
            {accounts.length >= 2 ? (
              <Stack.Toolbar.Button
                icon="arrow.up.arrow.down"
                onPress={() => router.push("/transfer")}
              />
            ) : null}
            {archivedAccounts.length > 0 ? (
              <Stack.Toolbar.Button
                icon="archivebox"
                onPress={() => router.push("/archived")}
              />
            ) : null}
            <Stack.Toolbar.Spacer sharesBackground={false} />
            <Stack.Toolbar.Button
              icon="plus"
              onPress={() => router.push("/new")}
            />
          </Stack.Toolbar>
        </>
      )}
    </ScrollView>
  );
}
