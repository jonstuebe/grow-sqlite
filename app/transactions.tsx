import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/text";
import { useAccount, useDeleteTransaction, useTransactions } from "@/db/hooks";
import type { Transaction, TransactionType } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";

type SFSymbolName = SymbolViewProps["name"];

function getTransactionIcon(type: TransactionType): SFSymbolName {
  switch (type) {
    case "deposit":
      return "arrow.down.circle.fill";
    case "withdrawal":
      return "arrow.up.circle.fill";
    case "transfer":
      return "arrow.left.arrow.right.circle.fill";
  }
}

function getTransactionColor(
  type: TransactionType,
  colors: ReturnType<typeof useTheme>["colors"]
): string {
  switch (type) {
    case "deposit":
      return colors.green;
    case "withdrawal":
      return colors.red;
    case "transfer":
      return colors.blue;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TransactionRow({
  transaction,
  accountId,
}: {
  transaction: Transaction;
  accountId: string;
}) {
  const { colors, spacing, radius } = useTheme();

  // For transfers, determine if this is incoming or outgoing
  const isIncoming =
    transaction.type === "transfer" &&
    transaction.related_account_id === accountId;

  // Calculate display amount (positive for deposits/incoming, negative for withdrawals/outgoing)
  const displayAmount =
    transaction.type === "deposit" || isIncoming
      ? transaction.amount
      : -transaction.amount;

  const amountColorKey = displayAmount >= 0 ? "green" : "red";
  const amountPrefix = displayAmount >= 0 ? "+" : "";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.fillQuaternary,
        borderRadius: radius.xl,
        gap: spacing.md,
      }}
    >
      <SymbolView
        name={getTransactionIcon(transaction.type)}
        tintColor={getTransactionColor(transaction.type, colors)}
        size={28}
      />
      <View style={{ flex: 1 }}>
        <Text variant="caption1Regular" color="labelVibrantSecondary">
          {formatDate(transaction.created_at)}
        </Text>
      </View>
      <Text variant="bodyEmphasized" color={amountColorKey}>
        {amountPrefix}
        {formatCurrency(Math.abs(displayAmount))}
      </Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

  const { data: account } = useAccount(accountId ?? "");
  const { data: transactions = [], isLoading } = useTransactions(accountId);
  const deleteTransaction = useDeleteTransaction();

  const handleUndoLast = () => {
    if (transactions.length === 0) return;

    const lastTransaction = transactions[0];

    Alert.alert(
      "Undo Last Transaction",
      `Are you sure you want to delete this ${
        lastTransaction.type
      }?\n\n${formatCurrency(lastTransaction.amount)} on ${formatDate(
        lastTransaction.created_at
      )}\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction.mutateAsync(lastTransaction.id);
            } catch (error) {
              console.error("Failed to delete transaction:", error);
            }
          },
        },
      ]
    );
  };

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
          {account?.name ?? "Transactions"}
        </Stack.Header.Title>
        <Stack.Header.Right>
          {transactions.length > 0 && (
            <Stack.Header.Button
              icon="arrow.uturn.backward"
              onPress={handleUndoLast}
            />
          )}
        </Stack.Header.Right>
      </Stack.Header>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.md,
        }}
      >
        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text>Loading...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.xxxl,
            }}
          >
            <SymbolView
              name="tray"
              tintColor={colors.labelTertiary}
              size={48}
            />
            <Text
              size="bodyRegular"
              color="labelVibrantSecondary"
              style={{ marginTop: spacing.lg }}
            >
              No transactions yet
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              accountId={accountId ?? ""}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}
