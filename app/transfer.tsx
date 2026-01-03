import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/icon-button";
import { NumericKeypad } from "@/components/numeric-keypad";
import { AccountPicker } from "@/components/account-picker";
import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useAccounts, useCreateTransaction } from "@/db/hooks";
import { useTheme } from "@/hooks/useTheme";
import { useTransferReducer } from "@/hooks/useTransferReducer";
import { useTransferValidation } from "@/hooks/useTransferValidation";
import { formatCurrency } from "@/utils/format";

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();

  const { state, setFromIndex, setToIndex, swapAccounts, handleKeyPress } =
    useTransferReducer();

  const { fromIndex, toIndex, amount } = state;

  const fromAccount = fromIndex !== null ? accounts[fromIndex] ?? null : null;
  const toAccount = toIndex !== null ? accounts[toIndex] ?? null : null;

  const validationContext = useMemo(
    () => ({
      fromAccountBalance: fromAccount?.current_amount ?? null,
    }),
    [fromAccount?.current_amount]
  );

  const { errors, isValid } = useTransferValidation(state, validationContext);

  const handleTransfer = async () => {
    if (!isValid || !fromAccount || !toAccount) return;

    const numAmount = parseFloat(amount);

    try {
      await createTransaction.mutateAsync({
        account_id: fromAccount.id,
        amount: numAmount,
        type: "transfer",
        related_account_id: toAccount.id,
      });
      router.back();
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxxl,
        paddingBottom: insets.bottom + spacing.lg,
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <IconButton
        icon="xmark"
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: spacing.xl,
          left: spacing.lg,
        }}
      />
      <IconButton
        icon="checkmark"
        variant="primary"
        onPress={handleTransfer}
        style={{
          position: "absolute",
          top: spacing.xl,
          right: spacing.lg,
        }}
      />

      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            alignItems: "center",
            paddingVertical: spacing.lg,
            position: "relative",
          }}
        >
          <Text size="caption1Emphasized" color="labelVibrantSecondary">
            AMOUNT
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              size="largeTitleEmphasized"
              style={{ fontSize: 48, lineHeight: 56 }}
            >
              {formatCurrency(numAmount)}
            </Text>
          </View>
          {errors.amount && amount !== "" && (
            <View
              style={{
                position: "absolute",
                left: 0,
                bottom: -spacing.xs,
                width: "100%",
              }}
            >
              <Text
                size="caption1Regular"
                color="red"
                style={{ textAlign: "center" }}
              >
                {errors.amount}
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            gap: spacing.lg,
          }}
        >
          <View>
            <Text
              size="caption1Emphasized"
              color="labelVibrantSecondary"
              style={{
                marginBottom: spacing.sm,
              }}
            >
              FROM
            </Text>
            <AccountPicker
              accounts={accounts}
              selectedAccount={fromAccount}
              onSelect={setFromIndex}
            />
          </View>

          <View style={{ alignItems: "center" }}>
            <PressableGlass
              onPress={swapAccounts}
              glassProps={{
                style: {
                  backgroundColor: colors.backgroundTertiary,
                  borderRadius: radius.circle,
                  padding: spacing.md,
                },
              }}
            >
              <View>
                <SymbolView
                  name="arrow.up.arrow.down"
                  tintColor={colors.blue}
                  size={20}
                />
              </View>
            </PressableGlass>
          </View>

          <View style={{ marginTop: -spacing.xl }}>
            <Text
              size="caption1Emphasized"
              color="labelVibrantSecondary"
              style={{
                marginBottom: spacing.sm,
              }}
            >
              TO
            </Text>
            <AccountPicker
              accounts={accounts}
              selectedAccount={toAccount}
              onSelect={setToIndex}
            />
            {errors.toIndex && toIndex !== null && (
              <Text
                size="caption1Regular"
                color="red"
                style={{ marginTop: spacing.xs }}
              >
                {errors.toIndex}
              </Text>
            )}
          </View>
        </View>
      </View>
      <NumericKeypad onKeyPress={handleKeyPress} />
    </View>
  );
}
