// Theme configuration for light and dark modes
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6750A4",
    secondary: "#625B71",
    tertiary: "#7D5260",
    background: "#F6F0FF",
    surface: "#FFFBFE",
    surfaceVariant: "#E7E0EC",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#D0BCFF",
    secondary: "#CBC4D0",
    tertiary: "#F3B0C3",
    background: "#1C1B1F",
    surface: "#2B2930",
    surfaceVariant: "#49454E",
  },
};

export { lightTheme, darkTheme };
