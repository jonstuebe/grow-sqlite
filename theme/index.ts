import { colors } from "./tokens";

interface FontStyle {
  fontFamily: string;
  fontWeight:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
}

interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
  fonts: {
    regular: FontStyle;
    medium: FontStyle;
    bold: FontStyle;
    heavy: FontStyle;
  };
}
const fonts: {
  regular: FontStyle;
  medium: FontStyle;
  bold: FontStyle;
  heavy: FontStyle;
} = {
  regular: {
    fontFamily: "System",
    fontWeight: "400",
  },
  medium: {
    fontFamily: "System",
    fontWeight: "500",
  },
  bold: {
    fontFamily: "System",
    fontWeight: "bold",
  },
  heavy: {
    fontFamily: "System",
    fontWeight: "900",
  },
};

export const LightTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.blue.light,
    background: colors.white.light,
    card: colors.gray6.light,
    text: colors.labelPrimary.light,
    border: colors.separatorNonOpaque.light,
    notification: colors.red.light,
  },
  fonts,
};

export const DarkTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.blue.dark,
    background: colors.black.dark,
    card: colors.gray6.dark,
    text: colors.labelPrimary.dark,
    border: colors.separatorNonOpaque.dark,
    notification: colors.red.dark,
  },
  fonts,
};

export const theme = {
  light: LightTheme,
  dark: DarkTheme,
};
