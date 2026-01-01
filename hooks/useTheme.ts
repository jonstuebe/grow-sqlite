import { useColorScheme } from "react-native";

import { tokens } from "@/theme/tokens";

export function useTheme() {
  const mode = useColorScheme() ?? "dark";

  return {
    ...tokens,
    mode,
    isLightMode: "light" === mode,
    isDarkMode: "dark" === mode,
    colors: Object.fromEntries(
      Object.entries(tokens.colors).map(([key, value]) => {
        return [key, value[mode as "light" | "dark"]];
      })
    ) as any as {
      [key in keyof typeof tokens.colors]: string;
    },
  };
}
