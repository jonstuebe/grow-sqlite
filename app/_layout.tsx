import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useTheme } from "@/hooks/useTheme";

export default function RootLayout() {
  const { colors, radius, spacing } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: {
            flex: 1,
            backgroundColor: colors.backgroundSecondary,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
          },
        }}
      >
        <Stack.Header
          style={{
            backgroundColor: colors.backgroundSecondary,
          }}
        />
        <Stack.Screen name="index" />
        <Stack.Screen
          name="add"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="transfer"
          options={{
            headerShown: false,
            presentation: "formSheet",
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="deposit"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="withdrawal"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
