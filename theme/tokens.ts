/**
 * Design tokens for React Native
 * Based on iOS UIKit design guidelines
 */

export const colorByMode = (light: string, dark: string) => ({
  light,
  dark,
});

// Define colors with as const for better type inference
export const colors = {
  red: colorByMode("#FF3B30", "#FF453A"),
  orange: colorByMode("#FF9500", "#FF9F0A"),
  yellow: colorByMode("#FFCC00", "#FFD60A"),
  green: colorByMode("#34C759", "#30D158"),
  mint: colorByMode("#00C7BE", "#63E6E2"),
  teal: colorByMode("#30B0C7", "#40CBE0"),
  cyan: colorByMode("#32ADE6", "#64D2FF"),
  blue: colorByMode("#007AFF", "#0A84FF"),
  indigo: colorByMode("#5856D6", "#5E5CE6"),
  purple: colorByMode("#AF52DE", "#BF5AF2"),
  pink: colorByMode("#FF2D55", "#FF375F"),
  brown: colorByMode("#A2845E", "#AC8E68"),

  labelPrimary: colorByMode("#000000", "#FFFFFF"),
  labelSecondary: colorByMode("#3C3C4360", "#EBEBF560"),
  labelTertiary: colorByMode("#3C3C4330", "#EBEBF530"),
  labelQuaternary: colorByMode("#3C3C4318", "#EBEBF516"),
  labelVibrantPrimary: colorByMode("#000000", "#FFFFFF"),
  labelVibrantSecondary: colorByMode("#525252", "#adadad"),
  labelVibrantTertiary: colorByMode("#3D3D3D7C", "#C2C2C27C"),
  labelVibrantQuaternary: colorByMode("#3D3D3D66", "#C2C2C266"),

  gray: colorByMode("#8e8e93", "#8e8e93"),
  gray2: colorByMode("#aeaeb2", "#636366"),
  gray3: colorByMode("#c7c7cc", "#48484a"),
  gray4: colorByMode("#d1d1d6", "#3a3a3c"),
  gray5: colorByMode("#e5e5ea", "#2c2c2e"),
  gray6: colorByMode("#f2f2f7", "#1c1c1e"),

  black: colorByMode("#000000", "#000000"),
  white: colorByMode("#FFFFFF", "#FFFFFF"),

  backgroundPrimary: colorByMode("#ffffff", "#000000"),
  backgroundSecondary: colorByMode("#f2f2f7", "#1c1c1e"),
  backgroundTertiary: colorByMode("#ffffff", "#2c2c2e"),

  textPrimary: colorByMode("#ffffff", "#000000"),
  textPrimaryInverted: colorByMode("#000000", "#ffffff"),
  textSecondary: colorByMode("#f2f2f7", "#1c1c1e"),
  textSecondaryInverted: colorByMode("#1c1c1e", "#f2f2f7"),
  textTertiary: colorByMode("#ffffff", "#2c2c2e"),
  textTertiaryInverted: colorByMode("#2c2c2e", "#ffffff"),

  backgroundGroupedPrimary: colorByMode("#f2f2f7", "#000000"),
  backgroundGroupedSecondary: colorByMode("#ffffff", "#1c1c1e"),
  backgroundGroupedTertiary: colorByMode("#f2f2f7", "#2c2c2e"),

  fillPrimary: colorByMode("#78788033", "#7878805c"),
  fillSecondary: colorByMode("#78788029", "#78788052"),
  fillTertiary: colorByMode("#7676801f", "#7676803D"),
  fillQuaternary: colorByMode("#74748014", "#7474802e"),
  fillVibrantPrimary: colorByMode("#3D3D3D", "#C2C2C2FF"),
  fillVibrantSecondary: colorByMode("#7f7f7fB3", "#7f7f7fB3"),
  fillVibrantTertiary: colorByMode("#7f7f7f99", "#7f7f7f99"),

  separatorOpaque: colorByMode("#c6c6c8", "#38383a"),
  separatorNonOpaque: colorByMode("#54545820", "#545458a6"),

  materialThick: colorByMode("#EAEAEA", "#2D2D2D"),
  materialRegular: colorByMode("#C6C6C6", "#3A3A3A"),
  materialThin: colorByMode("#A0A0A0", "#505050"),
  materialUltraThin: colorByMode("#606060", "#5F5F5F"),
  materialChrome: colorByMode("#ffffff75", "#00000075"),

  rowContainer: colorByMode("#f2f2f7", "#1c1c1e"),
} as const;

// Typography definitions based on iOS UIKit text styles
const fontFamily = "System";
export const typography = {
  largeTitleRegular: {
    fontSize: 34,
    letterSpacing: -0.4,
    lineHeight: 41,
    fontFamily,
    fontWeight: "400",
  },
  largeTitleEmphasized: {
    fontSize: 34,
    letterSpacing: -0.4,
    lineHeight: 41,
    fontFamily,
    fontWeight: "600",
  },
  title1Regular: {
    fontSize: 28,
    letterSpacing: -0.4,
    lineHeight: 34,
    fontFamily,
    fontWeight: "400",
  },
  title1Emphasized: {
    fontSize: 28,
    letterSpacing: -0.4,
    lineHeight: 34,
    fontFamily,
    fontWeight: "500",
  },
  title2Regular: {
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 28,
    fontFamily,
    fontWeight: "400",
  },
  title2Emphasized: {
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 28,
    fontFamily,
    fontWeight: "500",
  },
  title3Regular: {
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 25,
    fontFamily,
    fontWeight: "400",
  },
  title3Emphasized: {
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 25,
    fontFamily,
    fontWeight: "600",
  },
  headlineRegular: {
    fontSize: 17,
    letterSpacing: -0.4,
    lineHeight: 22,
    fontFamily,
    fontWeight: "600",
  },
  headlineItalic: {
    fontSize: 17,
    letterSpacing: -0.4,
    lineHeight: 22,
    fontFamily,
    fontWeight: "600",
    fontStyle: "italic",
  },
  bodyRegular: {
    fontSize: 17,
    letterSpacing: -0.4,
    lineHeight: 22,
    fontFamily,
    fontWeight: "400",
  },
  bodyEmphasized: {
    fontSize: 17,
    letterSpacing: -0.4,
    lineHeight: 22,
    fontFamily,
    fontWeight: "600",
  },
  bodyItalic: {
    fontSize: 17,
    letterSpacing: -0.4,
    lineHeight: 22,
    fontFamily,
    fontWeight: "400",
    fontStyle: "italic",
  },
  bodyEmphasizedItalic: {
    fontSize: 17,
    letterSpacing: -0.4,
    lineHeight: 22,
    fontFamily,
    fontWeight: "600",
    fontStyle: "italic",
  },
  calloutRegular: {
    fontSize: 16,
    letterSpacing: -0.4,
    lineHeight: 21,
    fontFamily,
    fontWeight: "400",
  },
  calloutEmphasized: {
    fontSize: 16,
    letterSpacing: -0.4,
    lineHeight: 21,
    fontFamily,
    fontWeight: "600",
  },
  calloutItalic: {
    fontSize: 16,
    letterSpacing: -0.4,
    lineHeight: 21,
    fontFamily,
    fontWeight: "400",
    fontStyle: "italic",
  },
  calloutEmphasizedItalic: {
    fontSize: 16,
    letterSpacing: -0.4,
    lineHeight: 21,
    fontFamily,
    fontWeight: "600",
    fontStyle: "italic",
  },
  subheadlineRegular: {
    fontSize: 15,
    letterSpacing: -0.4,
    lineHeight: 20,
    fontFamily,
    fontWeight: "400",
  },
  subheadlineEmphasized: {
    fontSize: 15,
    letterSpacing: -0.4,
    lineHeight: 20,
    fontFamily,
    fontWeight: "600",
  },
  subheadlineItalic: {
    fontSize: 15,
    letterSpacing: -0.4,
    lineHeight: 20,
    fontFamily,
    fontWeight: "400",
    fontStyle: "italic",
  },
  subheadlineEmphasizedItalic: {
    fontSize: 15,
    letterSpacing: -0.4,
    lineHeight: 20,
    fontFamily,
    fontWeight: "600",
    fontStyle: "italic",
  },
  footnoteRegular: {
    fontSize: 13,
    letterSpacing: -0.4,
    lineHeight: 18,
    fontFamily,
    fontWeight: "400",
  },
  footnoteEmphasized: {
    fontSize: 13,
    letterSpacing: -0.4,
    lineHeight: 18,
    fontFamily,
    fontWeight: "600",
  },
  footnoteItalic: {
    fontSize: 13,
    letterSpacing: -0.4,
    lineHeight: 18,
    fontFamily,
    fontWeight: "400",
    fontStyle: "italic",
  },
  footnoteEmphasizedItalic: {
    fontSize: 13,
    letterSpacing: -0.4,
    lineHeight: 18,
    fontFamily,
    fontWeight: "600",
    fontStyle: "italic",
  },
  caption1Regular: {
    fontSize: 12,
    letterSpacing: -0.4,
    lineHeight: 16,
    fontFamily,
    fontWeight: "400",
  },
  caption1Emphasized: {
    fontSize: 12,
    letterSpacing: -0.4,
    lineHeight: 16,
    fontFamily,
    fontWeight: "500",
  },
  caption1Italic: {
    fontSize: 12,
    letterSpacing: -0.4,
    lineHeight: 16,
    fontFamily,
    fontWeight: "400",
    fontStyle: "italic",
  },
  caption1EmphasizedItalic: {
    fontSize: 12,
    letterSpacing: -0.4,
    lineHeight: 16,
    fontFamily,
    fontWeight: "500",
    fontStyle: "italic",
  },
  caption2Regular: {
    fontSize: 11,
    letterSpacing: -0.4,
    lineHeight: 13,
    fontFamily,
    fontWeight: "400",
  },
  caption2Emphasized: {
    fontSize: 11,
    letterSpacing: -0.4,
    lineHeight: 13,
    fontFamily,
    fontWeight: "600",
  },
  caption2Italic: {
    fontSize: 11,
    letterSpacing: -0.4,
    lineHeight: 13,
    fontFamily,
    fontWeight: "400",
    fontStyle: "italic",
  },
  caption2EmphasizedItalic: {
    fontSize: 11,
    letterSpacing: -0.4,
    lineHeight: 13,
    fontFamily,
    fontWeight: "600",
    fontStyle: "italic",
  },

  rowLabelTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily,
  },
  rowLabelSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily,
  },
} as const;

// Spacings, radiuses, and other UI metrics
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 24,
  xxl: 32,
  xxxl: 64,
} as const;

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  circle: 9999,

  rowContainer: 10,
} as const;

export const createShadow = ({
  offsetX,
  offsetY,
  color,
  blurRadius,
  spreadDistance = 0,
  inset = false,
}: {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadDistance?: number;
  color: string;
  inset?: boolean;
}): string => {
  return `${
    inset ? "inset " : ""
  }${offsetX}px ${offsetY}px ${blurRadius}px ${spreadDistance}px ${color}`;
};

export const shadow = {
  small: createShadow({
    offsetX: 0,
    offsetY: 2,
    blurRadius: 16,
    spreadDistance: 0,
    color: "#00000035",
    inset: false,
  }),
  medium: createShadow({
    offsetX: 0,
    offsetY: 0,
    blurRadius: 32,
    spreadDistance: 0,
    color: "#00000020",
    inset: false,
  }),
  large: createShadow({
    offsetX: 0,
    offsetY: 0,
    blurRadius: 100,
    spreadDistance: 0,
    color: "#00000010",
    inset: false,
  }),
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
};
