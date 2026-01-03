import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/icon-button";
import { NumericKeypad } from "@/components/numeric-keypad";
import { Text } from "@/components/text";
import { useAccount, useCreateTransaction } from "@/db/hooks";
import { useTheme } from "@/hooks/useTheme";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useWithdrawalReducer } from "@/hooks/useWithdrawalReducer";
import { formatCurrency } from "@/utils/format";

export default function WithdrawalScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const { data: account } = useAccount(accountId ?? "");
  const createTransaction = useCreateTransaction();

  const { state, handleKeyPress } = useWithdrawalReducer();
  const { amount } = state;

  const { navigateAway } = useUnsavedChangesWarning(amount !== "");

  const numAmount = parseFloat(amount) || 0;
  const currentBalance = account?.current_amount ?? 0;
  const newBalance = currentBalance - numAmount;
  const hasInsufficientFunds = numAmount > currentBalance;
  const isValid = account !== null && numAmount > 0 && !hasInsufficientFunds;

  const handleWithdrawal = async () => {
    if (!isValid || !account) return;

    try {
      await createTransaction.mutateAsync({
        account_id: account.id,
        amount: numAmount,
        type: "withdrawal",
      });
      navigateAway();
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

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
        onPress={handleWithdrawal}
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
          {hasInsufficientFunds && numAmount > 0 && (
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
                Insufficient funds
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text
            size="caption1Emphasized"
            color="labelVibrantSecondary"
            style={{
              marginBottom: spacing.sm,
            }}
          >
            WITHDRAW FROM
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              height: 64,
              paddingHorizontal: spacing.lg,
              backgroundColor: colors.fillQuaternary,
              borderRadius: radius.xl,
            }}
          >
            <View>
              <Text size="bodyRegular" color="labelVibrantPrimary">
                {account?.name ?? "Loading..."}
              </Text>
              <Text size="rowLabelSubtitle" color="labelVibrantSecondary">
                {account
                  ? formatCurrency(account.current_amount)
                  : "Loading..."}
              </Text>
            </View>
            {numAmount > 0 && account && (
              <View style={{ alignItems: "flex-end" }}>
                <Text size="caption1Emphasized" color="labelVibrantSecondary">
                  NEW BALANCE
                </Text>
                <Text
                  size="bodyEmphasized"
                  color={hasInsufficientFunds ? "red" : "blue"}
                >
                  {formatCurrency(newBalance)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <NumericKeypad onKeyPress={handleKeyPress} />
    </View>
  );
}
