import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/icon-button";
import { NumericKeypad } from "@/components/numeric-keypad";
import { Text } from "@/components/text";
import { useAccount, useCreateTransaction } from "@/db/hooks";
import { useTheme } from "@/hooks/useTheme";
import { useDepositReducer } from "@/hooks/useDepositReducer";
import { formatCurrency } from "@/utils/format";

export default function DepositScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const { data: account } = useAccount(accountId ?? "");
  const createTransaction = useCreateTransaction();

  const { state, handleKeyPress } = useDepositReducer();
  const { amount } = state;

  const numAmount = parseFloat(amount) || 0;
  const currentBalance = account?.current_amount ?? 0;
  const newBalance = currentBalance + numAmount;
  const isValid = account !== null && numAmount > 0;

  const handleDeposit = async () => {
    if (!isValid || !account) return;

    try {
      await createTransaction.mutateAsync({
        account_id: account.id,
        amount: numAmount,
        type: "deposit",
      });
      router.back();
    } catch (error) {
      console.error("Deposit failed:", error);
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
        onPress={handleDeposit}
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
        </View>

        <View>
          <Text
            size="caption1Emphasized"
            color="labelVibrantSecondary"
            style={{
              marginBottom: spacing.sm,
            }}
          >
            DEPOSIT TO
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
                <Text size="bodyEmphasized" color="blue">
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
