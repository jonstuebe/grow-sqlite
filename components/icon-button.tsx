import { SymbolView } from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";

import { PressableGlass } from "@/components/pressable-glass";
import { useTheme } from "@/hooks/useTheme";

export interface IconButtonProps {
  icon: string;
  onPress?: () => void;
  variant?: "default" | "primary";
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  variant = "default",
  style,
}: IconButtonProps) {
  const { colors, radius } = useTheme();

  const isPrimary = variant === "primary";

  return (
    <PressableGlass
      onPress={onPress}
      style={style}
      glassProps={{
        style: {
          width: 44,
          height: 44,
          borderRadius: radius.circle,
          alignItems: "center",
          justifyContent: "center",
          ...(isPrimary && { backgroundColor: colors.blue }),
        },
        ...(isPrimary && { glassEffectStyle: "clear" }),
      }}
    >
      <SymbolView name={icon} tintColor={colors.white} size={24} />
    </PressableGlass>
  );
}

