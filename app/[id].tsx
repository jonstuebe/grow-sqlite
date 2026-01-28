import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { Alert, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormField } from "@/components/form-field";
import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useAccount, useArchiveAccount, useUpdateAccount } from "@/db/hooks";
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
        initialBalance: account.current_amount.toString(),
      });
    }
  }, [account, initialize]);

  const hasChanges =
    account &&
    (name !== account.name ||
      goalEnabled !== account.goal_enabled ||
      targetAmount !== account.target_amount.toString());

  const parsedTargetAmount = parseFloat(targetAmount) || 0;
  const isValid = !goalEnabled || parsedTargetAmount > 0;

  const { navigateAway } = useUnsavedChangesWarning(hasChanges ?? false);

  const handleSave = async () => {
    if (!account || !hasChanges || !isValid) return;

    await updateAccount.mutateAsync({
      id: account.id,
      name: name.trim(),
      goal_enabled: goalEnabled,
      target_amount: parsedTargetAmount,
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
      ],
    );
  };

  const progress = getProgress(
    account?.current_amount ?? 0,
    account?.target_amount ?? 0,
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
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingTop: spacing.xxxl,
          paddingHorizontal: spacing.lg,
          gap: spacing.xl,
        }}
      >
        <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
          <Text variant="caption1Emphasized" color="labelVibrantSecondary">
            CURRENT BALANCE
          </Text>
          <Text
            variant="largeTitleEmphasized"
            style={{ fontSize: 48, lineHeight: 56 }}
          >
            {formatCurrency(account.current_amount)}
          </Text>
          {goalEnabled && account.target_amount > 0 ? (
            <Text variant="bodyRegular" color="labelVibrantSecondary">
              {Math.round(progress)}% of {formatCurrency(account.target_amount)}
            </Text>
          ) : null}
        </View>

        <View style={{ gap: spacing.md }}>
          <FormField.Root>
            <FormField.Label>Name</FormField.Label>
            <FormField.InputGroup>
              <FormField.TextInput
                value={name}
                onChangeText={setName}
                placeholder="Account name"
              />
            </FormField.InputGroup>
          </FormField.Root>
          <FormField.Root>
            <FormField.Label>Savings Goal</FormField.Label>
            <FormField.Switch
              value={goalEnabled}
              onValueChange={setGoalEnabled}
            />
          </FormField.Root>
          {goalEnabled ? (
            <FormField.Root>
              <FormField.Label>Target Amount</FormField.Label>
              <FormField.InputGroup>
                <FormField.InputAddon>$</FormField.InputAddon>
                <FormField.TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </FormField.InputGroup>
            </FormField.Root>
          ) : null}
        </View>
      </View>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        {hasChanges && isValid ? (
          <Stack.Toolbar.Button
            icon="checkmark"
            variant="done"
            onPress={handleSave}
          />
        ) : null}
      </Stack.Toolbar>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button
          icon="list.bullet"
          onPress={() => router.push(`/transactions?accountId=${account.id}`)}
        >
          Transactions
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer sharesBackground={false} />
        <Stack.Toolbar.Button
          icon="archivebox"
          tintColor={colors.red}
          onPress={handleArchive}
        />
      </Stack.Toolbar>
    </>
  );
}
