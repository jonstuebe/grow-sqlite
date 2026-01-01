import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { colors, typography } from "../theme/tokens";

export interface TextProps extends RNTextProps {
  color?: keyof typeof colors;
  size?: keyof typeof typography;
}

export function Text({ children, style, color, size, ...props }: TextProps) {
  const { colors, typography } = useTheme();

  return (
    <RNText
      style={[
        { color: color ? colors[color] : colors.textPrimaryInverted },
        size ? typography[size] : typography.bodyRegular,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
