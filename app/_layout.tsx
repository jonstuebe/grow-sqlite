import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Toaster } from "sonner-native";

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
        <GestureHandlerRootView>
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
                      // headerShown: false,
                      presentation: "formSheet",
                      sheetAllowedDetents: [0.6, 1],
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: {
                        height: "100%",
                        backgroundColor: colors.backgroundSecondary,
                      },
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
                      headerShown: true,
                      presentation: "formSheet",
                      sheetAllowedDetents: [0.3, 1],
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: {
                        height: "100%",
                        backgroundColor: colors.backgroundSecondary,
                      },
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
                      headerShown: false,
                      presentation: "formSheet",
                      sheetAllowedDetents: [0.4, 0.6],
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: {
                        height: "100%",
                        backgroundColor: colors.backgroundSecondary,
                      },
                    }}
                  />
                </Stack>
                <StatusBar style="auto" />
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    style: {
                      backgroundColor: colors.backgroundTertiary,
                      borderColor: colors.separatorOpaque,
                      borderWidth: 1,
                    },
                    titleStyle: {
                      color: colors.labelPrimary,
                    },
                    descriptionStyle: {
                      color: colors.labelSecondary,
                    },
                  }}
                />
              </BackgroundAdvertisingProvider>
            </NearbyConnectionsProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </DatabaseProvider>
  );
}
