import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Text } from "@/components/text";

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <View>
        <Text>Item {id}</Text>
      </View>
    </>
  );
}
