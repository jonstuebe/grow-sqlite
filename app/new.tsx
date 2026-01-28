import { Stack } from "expo-router/stack";
import { useRouter } from "expo-router";
import { View, TextInput, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormField } from "@/components/form-field";
import { Text } from "@/components/text";
import { useCreateAccountWithInitialBalance } from "@/db/hooks";
import { useAccountDetailReducer } from "@/hooks/useAccountDetailReducer";
import { useTheme } from "@/hooks/useTheme";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

export default function NewAccountScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const createAccount = useCreateAccountWithInitialBalance();

  const {
    state: { name, goalEnabled, targetAmount, initialBalance },
    setName,
    setGoalEnabled,
    setTargetAmount,
    setInitialBalance,
  } = useAccountDetailReducer({
    name: "",
    goalEnabled: false,
    targetAmount: "",
    initialBalance: "",
  });

  const canSave = name.trim().length > 0;

  // Form is dirty if any field has been modified
  const hasUnsavedChanges =
    name !== "" ||
    initialBalance !== "" ||
    goalEnabled !== false ||
    targetAmount !== "";

  const { navigateAway } = useUnsavedChangesWarning(hasUnsavedChanges);

  const handleSave = async () => {
    if (!canSave) return;

    await createAccount.mutateAsync({
      name: name.trim(),
      target_amount: parseFloat(targetAmount) || 0,
      goalEnabled,
      initialBalance: parseFloat(initialBalance) || 0,
    });
    navigateAway();
  };

  return (
    <>
      <Stack.Header
        style={{
          backgroundColor: colors.backgroundTertiary,
        }}
      />

      <Stack.Screen.Title style={{ color: colors.labelPrimary }}>
        New Account
      </Stack.Screen.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        {canSave && (
          <Stack.Toolbar.Button
            icon="checkmark"
            variant="done"
            onPress={handleSave}
          />
        )}
      </Stack.Toolbar>

      <View
        style={{
          flex: 1,
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.xl,
        }}
      >
        <View style={{ gap: spacing.md }}>
          <FormField.Root>
            <FormField.Label>Name</FormField.Label>
            <FormField.InputGroup>
              <FormField.TextInput
                value={name}
                onChangeText={setName}
                placeholder="Account name"
                autoFocus
              />
            </FormField.InputGroup>
          </FormField.Root>

          <FormField.Root>
            <FormField.Label>Initial Balance</FormField.Label>
            <FormField.InputGroup>
              <FormField.InputAddon>$</FormField.InputAddon>
              <FormField.TextInput
                value={initialBalance}
                onChangeText={setInitialBalance}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </FormField.InputGroup>
          </FormField.Root>

          <FormField.Root>
            <FormField.Label>Savings Goal</FormField.Label>
            <FormField.InputGroup>
              <FormField.Switch
                value={goalEnabled}
                onValueChange={setGoalEnabled}
              />
            </FormField.InputGroup>
          </FormField.Root>

          {goalEnabled && (
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
          )}
        </View>
      </View>
    </>
  );
}
