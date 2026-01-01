import { Stack } from "expo-router/stack";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Text } from "@/components/text";
import { useTheme } from "@/hooks/useTheme";

export default function TransferScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <>
      {/* <Stack.Header
        style={{
          backgroundColor: colors.backgroundTertiary,
        }}
      >
        
        <Stack.Header.Left>
          <Stack.Header.Button icon="xmark" onPress={() => router.back()} />
        </Stack.Header.Left>
        <Stack.Header.Right>
          <Stack.Header.Button icon="checkmark" variant="done" />
        </Stack.Header.Right>
      </Stack.Header> */}

      <View></View>
    </>
  );
}
