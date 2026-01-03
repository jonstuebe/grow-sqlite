import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { GlobalInvitationHandler } from "@/components/global-invitation-handler";
import { NearbyConnectionsProvider } from "@/context/nearby-connections";
import { DatabaseProvider } from "@/db/provider";
import { BackgroundAdvertisingProvider } from "@/hooks/useBackgroundAdvertising";
import { useTheme } from "@/hooks/useTheme";

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
          <NearbyConnectionsProvider>
            <BackgroundAdvertisingProvider>
              <GlobalInvitationHandler />
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
                    headerShown: false,
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="transactions"
                  options={{
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="archived"
                  options={{
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="import"
                  options={{
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="sync"
                  options={{
                    presentation: "modal",
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
            </BackgroundAdvertisingProvider>
          </NearbyConnectionsProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </DatabaseProvider>
  );
}
