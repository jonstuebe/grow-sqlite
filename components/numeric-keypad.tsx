import { SymbolView } from "expo-symbols";
import { View } from "react-native";

import { PressableGlass } from "@/components/pressable-glass";
import { Text } from "@/components/text";
import { useTheme } from "@/hooks/useTheme";
import { KeypadKey } from "@/hooks/useTransferReducer";

const keys: KeypadKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
];

export function NumericKeypad({
  onKeyPress,
}: {
  onKeyPress: (key: KeypadKey) => void;
}) {
  const { colors, spacing, radius } = useTheme();

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
