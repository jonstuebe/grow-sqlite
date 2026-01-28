import {
  Button,
  Host,
  HStack,
  Image,
  Popover,
  Spacer,
  Text as SwiftUIText,
  VStack,
} from "@expo/ui/swift-ui";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import type { Account } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";
import {
  buttonStyle,
  disabled,
  foregroundStyle,
  frame,
  opacity,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";

export interface AccountPickerProps {
  accounts: Account[];
  selectedAccount: Account | null;
  disabledAccount: Account | null;
  onSelect: (index: number | null) => void;
  placeholder?: string;
  emptySubtitle?: string;
}

export function AccountPicker({
  accounts,
  selectedAccount,
  disabledAccount,
  onSelect,
  placeholder = "No Account Selected",
  emptySubtitle = "Please select account",
}: AccountPickerProps) {
  const { colors, spacing, radius } = useTheme();
  const [isPresented, setIsPresented] = useState(false);

  return (
    <Host matchContents>
      <Popover
        attachmentAnchor="bottom"
        arrowEdge="top"
        isPresented={isPresented}
        onIsPresentedChange={setIsPresented}
      >
        <Popover.Trigger>
          <PressableGlass
            onPress={() => setIsPresented(true)}
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
              <Text variant="bodyRegular" color="labelVibrantPrimary">
                {selectedAccount?.name ?? placeholder}
              </Text>
              <Text variant="rowLabelSubtitle" color="labelVibrantSecondary">
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
        </Popover.Trigger>
        <Popover.Content>
          <VStack
            spacing={spacing.lg}
            modifiers={[
              frame({
                idealWidth: 240,
              }),

              frame({
                alignment: "leading",
              }),
              padding({
                all: spacing.xl,
              }),
            ]}
          >
            {accounts.map((account, idx) => {
              const isDisabled = disabledAccount?.id === account.id;

              return (
                <Button
                  key={idx}
                  modifiers={[
                    opacity(isDisabled ? 0.5 : 1),
                    disabled(isDisabled),
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    onSelect(idx);
                    setIsPresented(false);
                  }}
                >
                  <HStack>
                    <VStack alignment="leading">
                      <SwiftUIText
                        modifiers={[
                          foregroundStyle(colors.labelVibrantPrimary),
                        ]}
                      >
                        {account.name}
                      </SwiftUIText>
                      <SwiftUIText
                        modifiers={[foregroundStyle(colors.labelSecondary)]}
                      >
                        {formatCurrency(account.current_amount)}
                      </SwiftUIText>
                    </VStack>
                    <Spacer />
                    {selectedAccount?.id === account.id ? (
                      <Image systemName="checkmark" size={16} />
                    ) : null}
                  </HStack>
                </Button>
              );
            })}
            <Spacer />
            <Button
              modifiers={[buttonStyle("borderless")]}
              onPress={() => {
                setIsPresented(false);
                onSelect(null);
              }}
            >
              <SwiftUIText>Reset</SwiftUIText>
            </Button>
          </VStack>
        </Popover.Content>
      </Popover>
    </Host>
  );
}
