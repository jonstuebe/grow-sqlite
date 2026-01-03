import {
  TextInput as RNTextInput,
  View,
  Switch as RNSwitch,
  type SwitchProps,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
  type TextStyle,
  Pressable,
} from "react-native";

import { Text } from "@/components/text";
import { useTheme } from "@/hooks/useTheme";
import { SymbolView } from "expo-symbols";

interface FormFieldRootProps extends ViewProps {}

function Root({ children, style, ...props }: FormFieldRootProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.fillQuaternary,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.lg,
          height: 48,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface FormFieldLabelProps {
  children: React.ReactNode;
}

function Label({ children }: FormFieldLabelProps) {
  return (
    <Text variant="rowLabelTitle" color="labelVibrantPrimary" style={{ flex: 1 }}>
      {children}
    </Text>
  );
}

function InputGroup({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      {children}
    </View>
  );
}

interface FormInputAddonProps {
  children: React.ReactNode;
}

function InputAddon({ children }: FormInputAddonProps) {
  if (typeof children === "string") {
    children = (
      <Text variant="rowLabelTitle" color="labelVibrantPrimary">
        {children}
      </Text>
    );
  }

  return children;
}

interface FormFieldTextInputProps
  extends Omit<TextInputProps, "placeholderTextColor"> {}

function TextInput({ style, value, ...props }: FormFieldTextInputProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <RNTextInput
        placeholderTextColor={colors.labelTertiary}
        style={[
          {
            color: colors.labelPrimary,
            fontSize: typography.rowLabelTitle.fontSize,
            fontFamily: typography.rowLabelTitle.fontFamily,
          },
          style,
        ]}
        value={value}
        {...props}
      />
      {value ? (
        <Pressable onPress={() => props.onChangeText?.("")}>
          <SymbolView
            name="xmark.circle.fill"
            tintColor={colors.labelTertiary}
            size={20}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

interface FormFieldSwitchProps extends SwitchProps {}

function Switch(props: FormFieldSwitchProps) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <RNSwitch {...props} />
    </View>
  );
}

export const FormField = {
  Root,
  Label,
  TextInput,
  Switch,

  InputGroup,
  InputAddon,
};
