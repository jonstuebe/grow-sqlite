import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { DatabaseProvider } from "@/db/provider";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardProvider } from "react-native-keyboard-controller";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 30 seconds
      staleTime: 30 * 1000,
    },
  },
});

export default function RootLayout() {
  const { colors, radius } = useTheme();

  return (
    <DatabaseProvider>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
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
              name="new"
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
                presentation: "modal",
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
                headerShown: false,
                presentation: "modal",
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
        </KeyboardProvider>
      </QueryClientProvider>
    </DatabaseProvider>
  );
}
