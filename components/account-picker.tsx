import {
  Button,
  ContextMenu,
  Host,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import type { Account } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";

export interface AccountPickerProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelect: (index: number) => void;
  placeholder?: string;
  emptySubtitle?: string;
}

export function AccountPicker({
  accounts,
  selectedAccount,
  onSelect,
  placeholder = "No Account Selected",
  emptySubtitle = "Please select account",
}: AccountPickerProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Host>
      <ContextMenu>
        <ContextMenu.Items>
          {accounts.map((account, idx) => (
            <Button key={idx} onPress={() => onSelect(idx)}>
              <SwiftUIText>{account.name}</SwiftUIText>
              <SwiftUIText>
                {formatCurrency(account.current_amount)}
              </SwiftUIText>
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
                height: 64,
                paddingHorizontal: spacing.lg,
                backgroundColor: colors.fillQuaternary,
                borderRadius: radius.xl,
              },
            }}
          >
            <View>
              <Text size="bodyRegular" color="labelVibrantPrimary">
                {selectedAccount?.name ?? placeholder}
              </Text>
              <Text size="rowLabelSubtitle" color="labelVibrantSecondary">
                {selectedAccount
                  ? formatCurrency(selectedAccount.current_amount)
                  : emptySubtitle}
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
  );
}
