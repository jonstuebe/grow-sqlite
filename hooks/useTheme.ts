import { useColorScheme } from "react-native";

import { tokens } from "@/theme/tokens";

export function useTheme() {
  const mode = (useColorScheme() ?? "dark") as "light" | "dark";

  return {
    ...tokens,
    mode,
    isLightMode: "light" === mode,
    isDarkMode: "dark" === mode,
    colors: Object.fromEntries(
      Object.entries(tokens.colors).map(([name, value]) => {
        return [name, value[mode]];
      })
    ) as any as {
      [key in keyof typeof tokens.colors]: string;
    },
  };
}
