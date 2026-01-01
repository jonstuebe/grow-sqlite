import { GlassView } from "expo-glass-effect";
import { Link, Stack, useRouter } from "expo-router";
import { Toolbar } from "expo-router/unstable-toolbar";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/text";
import { useTheme } from "@/hooks/useTheme";
import { PressableGlass } from "../components/pressable-glass";

export default function HomeScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <>
      <Stack.Header
        style={{
          backgroundColor: colors.backgroundPrimary,
        }}
      >
        <Stack.Header.Title
          style={{ color: colors.labelPrimary, fontSize: 32 }}
        >
          $20,000.00
        </Stack.Header.Title>
      </Stack.Header>

      <View
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <Link href={`/kdjf90-dkfjd-2dk`} asChild>
              <Link.Trigger>
                <PressableGlass
                  style={{
                    position: "relative",
                    flex: 1,
                  }}
                  glassProps={{
                    style: {
                      borderRadius: radius.xxl,
                      overflow: "hidden",
                    },
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "50.05%",
                      height: "100%",
                      backgroundColor: colors.fillQuaternary,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                    }}
                  >
                    <View>
                      <Text size="headlineRegular">House</Text>
                      <Text size="calloutRegular" color="labelVibrantSecondary">
                        $350.35 of $700
                      </Text>
                    </View>
                    <Text size="title3Regular" color="labelVibrantSecondary">
                      50%
                    </Text>
                  </View>
                </PressableGlass>
              </Link.Trigger>
              {/* <Link.Menu>
                <Link.MenuAction icon="pencil">Edit</Link.MenuAction>
                <Link.MenuAction destructive icon="trash">
                  Delete
                </Link.MenuAction>
              </Link.Menu> */}
            </Link>
            <Link href="/withdrawal" asChild>
              <PressableGlass
                glassProps={{
                  style: {
                    borderRadius: radius.circle,
                    padding: spacing.sm,
                    width: 56,
                    height: 56,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                }}
              >
                <SymbolView name="minus" tintColor={colors.red} size={24} />
              </PressableGlass>
            </Link>
            <Link href="/deposit" asChild>
              <PressableGlass
                glassProps={{
                  style: {
                    borderRadius: radius.circle,
                    padding: spacing.sm,
                    width: 56,
                    height: 56,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                }}
              >
                <SymbolView name="plus" tintColor={colors.blue} size={24} />
              </PressableGlass>
            </Link>
          </View>
        </ScrollView>
      </View>

      <Toolbar>
        <Toolbar.Button
          icon="arrow.up.arrow.down"
          onPress={() => router.push("/transfer")}
        />
        <Toolbar.Spacer sharesBackground={false} />
        <Toolbar.Button icon="plus" onPress={() => router.push("/add")} />
      </Toolbar>
    </>
  );
}
