import {
  Button,
  ContextMenu,
  Host,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useAccounts, useCreateTransaction } from "@/db/hooks";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";

type KeypadKey =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "0"
  | "backspace";

function NumericKeypad({
  onKeyPress,
}: {
  onKeyPress: (key: KeypadKey) => void;
}) {
  const { colors, spacing, radius } = useTheme();

  const keys: KeypadKey[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  return (
    <View style={{ gap: spacing.md }}>
      {keys.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: "row",
            gap: spacing.md,
          }}
        >
          {row.map((key) => (
            <PressableGlass
              key={key}
              onPress={() => onKeyPress(key)}
              style={{
                flex: 1,
                aspectRatio: 1.8,
              }}
              glassProps={{
                style: {
                  flex: 1,
                  borderRadius: radius.xxl,
                  alignItems: "center",
                  justifyContent: "center",
                },
              }}
            >
              {key === "backspace" ? (
                <SymbolView
                  name="delete.left"
                  tintColor={colors.labelPrimary}
                  size={24}
                />
              ) : (
                <Text size="title1Emphasized" style={{ fontSize: 28 }}>
                  {key}
                </Text>
              )}
            </PressableGlass>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();

  const [fromIndex, setFromIndex] = useState<number>(0);
  const [toIndex, setToIndex] = useState<number>(1);
  const [amount, setAmount] = useState("");

  const handleKeyPress = useCallback((key: KeypadKey) => {
    setAmount((prev) => {
      if (key === "backspace") {
        return prev.slice(0, -1);
      }
      if (key === ".") {
        // Only allow one decimal point
        if (prev.includes(".")) return prev;
        // Add leading zero if starting with decimal
        if (prev === "") return "0.";
        return prev + ".";
      }
      // Limit decimal places to 2
      const decimalIndex = prev.indexOf(".");
      if (decimalIndex !== -1 && prev.length - decimalIndex > 2) {
        return prev;
      }
      // Prevent leading zeros
      if (prev === "0") {
        return key;
      }
      return prev + key;
    });
  }, []);

  const fromAccount = accounts[fromIndex] ?? null;
  const toAccount = accounts[toIndex] ?? null;

  const handleSwap = () => {
    const tempFrom = fromIndex;
    setFromIndex(toIndex);
    setToIndex(tempFrom);
  };

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !amount) return;
    if (fromAccount.id === toAccount.id) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (numAmount > fromAccount.current_amount) return;

    try {
      await createTransaction.mutateAsync({
        account_id: fromAccount.id,
        amount: numAmount,
        type: "transfer",
        related_account_id: toAccount.id,
        description: `Transfer to ${toAccount.name}`,
      });
      router.back();
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const isSameAccount = fromAccount?.id === toAccount?.id;

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
      <PressableGlass
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: spacing.xl,
          left: spacing.lg,
        }}
        glassProps={{
          style: {
            width: 44,
            height: 44,
            borderRadius: radius.circle,
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <SymbolView name="xmark" tintColor={colors.white} size={24} />
      </PressableGlass>
      <PressableGlass
        onPress={handleTransfer}
        style={{
          position: "absolute",
          top: spacing.xl,
          right: spacing.lg,
        }}
        glassProps={{
          style: {
            width: 44,
            height: 44,
            borderRadius: radius.circle,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.blue,
          },
          glassEffectStyle: "clear",
        }}
      >
        <SymbolView name="checkmark" tintColor={colors.white} size={24} />
      </PressableGlass>

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
          {fromAccount && numAmount > fromAccount.current_amount && (
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
            <Host>
              <ContextMenu>
                <ContextMenu.Items>
                  {accounts.map((account, idx) => (
                    <Button key={idx} onPress={() => setFromIndex(idx)}>
                      <SwiftUIText>{account.name}</SwiftUIText>
                    </Button>
                  ))}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <PressableGlass
                    glassProps={{
                      style: {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: spacing.lg,
                        backgroundColor: colors.fillQuaternary,
                        borderRadius: radius.xl,
                      },
                    }}
                  >
                    <View>
                      <Text size="bodyRegular" color="labelVibrantPrimary">
                        {fromAccount?.name}
                      </Text>
                      <Text
                        size="rowLabelSubtitle"
                        color="labelVibrantSecondary"
                      >
                        {formatCurrency(fromAccount.current_amount)}
                      </Text>
                    </View>
                    <SymbolView
                      name="chevron.up.chevron.down"
                      tintColor={colors.blue}
                      size={20}
                    />
                  </PressableGlass>
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          </View>

          <View style={{ alignItems: "center" }}>
            <PressableGlass
              onPress={handleSwap}
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
            <Host>
              <ContextMenu>
                <ContextMenu.Items>
                  {accounts.map((account, idx) => (
                    <Button key={idx} onPress={() => setToIndex(idx)}>
                      <SwiftUIText>{account.name}</SwiftUIText>
                    </Button>
                  ))}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <PressableGlass
                    glassProps={{
                      style: {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: spacing.lg,
                        backgroundColor: colors.fillQuaternary,
                        borderRadius: radius.xl,
                      },
                    }}
                  >
                    <View>
                      <Text size="bodyRegular" color="labelVibrantPrimary">
                        {toAccount?.name}
                      </Text>
                      <Text
                        size="rowLabelSubtitle"
                        color="labelVibrantSecondary"
                      >
                        {formatCurrency(toAccount.current_amount)}
                      </Text>
                    </View>
                    <SymbolView
                      name="chevron.up.chevron.down"
                      tintColor={colors.blue}
                      size={20}
                    />
                  </PressableGlass>
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          </View>
        </View>
      </View>
      <NumericKeypad onKeyPress={handleKeyPress} />
    </View>
  );
}
