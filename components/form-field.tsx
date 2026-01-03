import { View, ViewStyle } from "react-native";

import { Text } from "@/components/text";
import { useTheme } from "@/hooks/useTheme";

interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormField({ label, children, style }: FormFieldProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.fillQuaternary,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          flexDirection: label ? "row" : undefined,
          justifyContent: label ? "space-between" : undefined,
          alignItems: label ? "center" : undefined,
        },
        style,
      ]}
    >
      {label && (
        <Text size="rowLabelTitle" color="labelVibrantPrimary">
          {label}
        </Text>
      )}
      {children}
    </View>
  );
}
