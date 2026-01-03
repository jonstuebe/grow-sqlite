import { useNavigation } from "@react-navigation/native";
import { usePreventRemove } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseUnsavedChangesWarningOptions {
  title?: string;
  message?: string;
  cancelText?: string;
  discardText?: string;
}

export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  options?: UseUnsavedChangesWarningOptions
) {
  const navigation = useNavigation();
  const router = useRouter();
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);

  const {
    title = "Discard changes?",
    message = "You have unsaved changes. Are you sure you want to discard them?",
    cancelText = "Don't leave",
    discardText = "Discard",
  } = options ?? {};

  usePreventRemove(hasUnsavedChanges && !isNavigatingAway, ({ data }) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel" },
      {
        text: discardText,
        style: "destructive",
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  // Navigate after state update ensures the hook sees isNavigatingAway = true
  useEffect(() => {
    if (isNavigatingAway) {
      router.back();
    }
  }, [isNavigatingAway, router]);

  // Call this instead of router.back() when intentionally leaving (e.g., after save)
  const navigateAway = useCallback(() => {
    setIsNavigatingAway(true);
  }, []);

  return { navigateAway };
}

