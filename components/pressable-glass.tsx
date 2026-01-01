import { GlassView, type GlassViewProps } from "expo-glass-effect";
import { Pressable, type PressableProps } from "react-native";

export interface PressableGlassProps extends PressableProps {
  glassProps?: Omit<GlassViewProps, "children">;
}

export function PressableGlass({
  children,
  glassProps = { isInteractive: true },
  ...props
}: PressableGlassProps) {
  if (glassProps && glassProps.isInteractive === undefined) {
    glassProps.isInteractive = true;
  }

  return (
    <Pressable {...props}>
      {(state) => (
        <GlassView {...glassProps}>
          {typeof children === "function" ? children(state) : children}
        </GlassView>
      )}
    </Pressable>
  );
}
