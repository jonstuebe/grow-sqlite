import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { Alert, TextInput, View, ScrollView, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormField } from "@/components/form-field";
import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useAccount, useUpdateAccount, useArchiveAccount } from "@/db/hooks";
import { useAccountDetailReducer } from "@/hooks/useAccountDetailReducer";
import { useTheme } from "@/hooks/useTheme";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { formatCurrency, getProgress } from "@/utils/format";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();

  const { data: account, isLoading } = useAccount(id ?? "");
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();

  // Local form state
  const {
    state: { name, goalEnabled, targetAmount },
    setName,
    setGoalEnabled,
    setTargetAmount,
    initialize,
  } = useAccountDetailReducer();

  // Sync form state with account data
  useEffect(() => {
    if (account) {
      initialize({
        name: account.name,
        goalEnabled: account.goal_enabled,
        targetAmount: account.target_amount.toString(),
      });
    }
  }, [account, initialize]);

  const hasChanges =
    account &&
    (name !== account.name ||
      goalEnabled !== account.goal_enabled ||
      targetAmount !== account.target_amount.toString());

  const { navigateAway } = useUnsavedChangesWarning(hasChanges ?? false);

  const handleSave = async () => {
    if (!account || !hasChanges) return;

    await updateAccount.mutateAsync({
      id: account.id,
      name: name.trim(),
      goal_enabled: goalEnabled,
      target_amount: parseFloat(targetAmount) || 0,
    });
    navigateAway();
  };

  const handleArchive = () => {
    if (!account) return;

    Alert.alert(
      "Archive Account",
      `Are you sure you want to archive "${account.name}"? This will hide it from your accounts list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveAccount.mutateAsync(account.id);
              router.back();
            } catch (error) {
              console.error("Failed to archive account:", error);
            }
          },
        },
      ]
    );
  };

  const progress = getProgress(
    account?.current_amount ?? 0,
    account?.target_amount ?? 0
  );

  if (isLoading || !account) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
          Account Details
        </Stack.Header.Title>
        <Stack.Header.Right>
          {hasChanges && (
            <Stack.Header.Button
              icon="checkmark"
              variant="done"
              onPress={handleSave}
            />
          )}
        </Stack.Header.Right>
      </Stack.Header>

      <View
        style={{
          flex: 1,
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.xl,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: spacing.md }}>
          <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
            <Text size="caption1Emphasized" color="labelVibrantSecondary">
              CURRENT BALANCE
            </Text>
            <Text
              size="largeTitleEmphasized"
              style={{ fontSize: 48, lineHeight: 56 }}
            >
              {formatCurrency(account.current_amount)}
            </Text>
            {goalEnabled && account.target_amount > 0 && (
              <Text size="bodyRegular" color="labelVibrantSecondary">
                {Math.round(progress)}% of{" "}
                {formatCurrency(account.target_amount)}
              </Text>
            )}
          </View>

          <View style={{ gap: spacing.md }}>
            <FormField label="Name">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Account name"
                placeholderTextColor={colors.labelTertiary}
                style={{
                  flex: 1,
                  textAlign: "right",
                  color: colors.labelPrimary,
                  fontSize: typography.rowLabelTitle.fontSize,
                  fontFamily: typography.rowLabelTitle.fontFamily,
                }}
              />
            </FormField>
            <FormField label="Savings Goal">
              <Switch value={goalEnabled} onValueChange={setGoalEnabled} />
            </FormField>
            {goalEnabled && (
              <FormField label="Target Amount">
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="$0"
                  placeholderTextColor={colors.labelTertiary}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    textAlign: "right",
                    color: colors.labelPrimary,
                    fontSize: typography.rowLabelTitle.fontSize,
                    fontFamily: typography.rowLabelTitle.fontFamily,
                  }}
                />
              </FormField>
            )}
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Link href={`/transactions?accountId=${account.id}`} asChild>
            <PressableGlass
              glassProps={{
                style: {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.lg,
                  borderRadius: radius.xl,
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
                <Text size="rowLabelTitle">View Transactions</Text>
              </View>
              <SymbolView
                name="chevron.right"
                tintColor={colors.labelTertiary}
                size={14}
              />
            </PressableGlass>
          </Link>

          {/* Archive Button */}
          <PressableGlass
            onPress={handleArchive}
            glassProps={{
              style: {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
                borderRadius: radius.xl,
                gap: spacing.sm,
              },
            }}
          >
            <SymbolView name="archivebox" tintColor={colors.red} size={20} />
            <Text size="bodyRegular" color="red">
              Archive Account
            </Text>
          </PressableGlass>
        </View>
      </View>
    </>
  );
}
