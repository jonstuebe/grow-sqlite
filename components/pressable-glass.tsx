import { GlassView, type GlassViewProps } from "expo-glass-effect";
import { Pressable, type PressableProps } from "react-native";

export interface PressableGlassProps extends PressableProps {
  glassProps?: Omit<GlassViewProps, "children">;
}

export function PressableGlass({
  children,
  glassProps,
  ...props
}: PressableGlassProps) {
  return (
    <Pressable {...props}>
      {(state) => (
        <GlassView isInteractive {...glassProps}>
          {typeof children === "function" ? children(state) : children}
        </GlassView>
      )}
    </Pressable>
  );
}
