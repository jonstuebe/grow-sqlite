import { Stack, useRouter } from "expo-router";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useArchivedAccounts, useUnarchiveAccount } from "@/db/hooks";
import type { Account } from "@/db/types";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/format";
import {
  Button,
  Host,
  HStack,
  Label,
  List,
  ProgressView,
  Section,
  Spacer,
  Text as SwiftUIText,
  VStack,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  foregroundStyle,
  labelStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";

// function ArchivedAccountRow({
//   account,
//   onUnarchive,
// }: {
//   account: Account;
//   onUnarchive: (account: Account) => void;
// }) {
//   const { colors, spacing, radius } = useTheme();

//   return (
//     <View
//       style={{
//         flexDirection: "row",
//         alignItems: "center",
//         gap: spacing.md,
//       }}
//     >
//       <PressableGlass
//         style={{ flex: 1 }}
//         glassProps={{
//           style: {
//             borderRadius: radius.xxl,
//             overflow: "hidden",
//           },
//         }}
//       >
//         <View
//           style={{
//             flexDirection: "row",
//             justifyContent: "space-between",
//             alignItems: "center",
//             paddingVertical: spacing.md,
//             paddingHorizontal: spacing.lg,
//           }}
//         >
//           <View>
//             <Text variant="rowLabelTitle">{account.name}</Text>
//             <Text variant="rowLabelSubtitle" color="labelVibrantSecondary">
//               {formatCurrency(account.current_amount)}
//             </Text>
//           </View>
//         </View>
//       </PressableGlass>

//       <PressableGlass
//         onPress={() => onUnarchive(account)}
//         glassProps={{
//           style: {
//             borderRadius: radius.circle,
//             padding: spacing.sm,
//             width: 56,
//             height: 56,
//             alignItems: "center",
//             justifyContent: "center",
//           },
//         }}
//       >
//         <SymbolView
//           name="arrow.uturn.backward"
//           tintColor={colors.blue}
//           size={24}
//         />
//       </PressableGlass>
//     </View>
//   );
// }

export default function ArchivedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const { data: archivedAccounts = [], isLoading } = useArchivedAccounts();
  const unarchiveAccount = useUnarchiveAccount();

  const handleUnarchive = (account: Account) => {
    Alert.alert(
      "Restore Account",
      `Are you sure you want to restore "${account.name}"? This will move it back to your accounts list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              await unarchiveAccount.mutateAsync(account.id);
              // If no more archived accounts, go back
              if (archivedAccounts.length === 1) {
                router.back();
              }
            } catch (error) {
              console.error("Failed to restore account:", error);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      {/* <ScrollView
        style={{ flex: 1, paddingHorizontal: spacing.lg }}
        contentInsetAdjustmentBehavior="automatic"
        // contentContainerStyle={{
        //   padding: spacing.lg,
        //   paddingBottom: insets.bottom + spacing.lg,
        //   gap: spacing.md,
        // }}
      >
        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text>Loading...</Text>
          </View>
        ) : archivedAccounts.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.xxxl,
            }}
          >
            <SymbolView
              name="archivebox"
              tintColor={colors.labelTertiary}
              size={48}
            />
            <Text
              variant="bodyRegular"
              color="labelVibrantSecondary"
              style={{ marginTop: spacing.lg }}
            >
              No archived accounts
            </Text>
          </View>
        ) : (
          // archivedAccounts.map((account) => (
          //   <ArchivedAccountRow
          //     key={account.id}
          //     account={account}
          //     onUnarchive={handleUnarchive}
          //   />
          // ))
          <Host style={{ flex: 1 }}>
            <List>
              <Section title="Archived Accounts">
                {archivedAccounts.map((account) => (
                  <VStack
                    key={account.id}
                    modifiers={[listRowBackground("blue")]}
                  >
                    <SwiftUIText>{account.name}</SwiftUIText>
                    <SwiftUIText>
                      {formatCurrency(account.current_amount)}
                    </SwiftUIText>
                  </VStack>
                ))}
              </Section>
            </List>
          </Host>
        )}
      </ScrollView> */}
      <Host style={{ flex: 1 }}>
        {isLoading ? (
          <ProgressView>
            <SwiftUIText modifiers={[padding({ top: spacing.xs })]}>
              Loading Archived Accounts...
            </SwiftUIText>
          </ProgressView>
        ) : (
          <List>
            <Section>
              {archivedAccounts.map((account) => (
                <HStack key={account.id} modifiers={[]}>
                  <VStack spacing={spacing.xs} alignment="leading">
                    <Label
                      title={account.name}
                      modifiers={[
                        foregroundStyle({
                          type: "hierarchical",
                          style: "primary",
                        }),
                      ]}
                    />
                    <Label
                      title={formatCurrency(account.current_amount)}
                      modifiers={[
                        foregroundStyle({
                          type: "hierarchical",
                          style: "secondary",
                        }),
                      ]}
                    />
                  </VStack>
                  <Spacer />
                  <Button
                    label="Restore"
                    modifiers={[
                      buttonStyle("glass"),
                      padding({
                        all: spacing.sm,
                      }),
                      labelStyle("iconOnly"),
                    ]}
                    systemImage="arrow.uturn.backward"
                    onPress={() => handleUnarchive(account)}
                  />
                </HStack>
              ))}
            </Section>
          </List>
        )}
      </Host>
      <Stack.Screen.Title
        large
        style={{ color: colors.labelPrimary }}
        largeStyle={{ color: colors.labelPrimary }}
      >
        Archived Accounts
      </Stack.Screen.Title>
    </>
  );
}
