// Root layout: initialises auth and routes to the correct stack.
import "react-native-url-polyfill/auto";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import useAuthStore from "../src/store/authStore";
import useThemeStore from "../src/store/themeStore";
import { lightTheme, darkTheme } from "../src/utils/themes";

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initializeTheme = useThemeStore((s) => s.initialize);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const themeLoading = useThemeStore((s) => s.loading);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const setupApp = async () => {
      await initializeTheme();
      await initializeAuth();
      setAppReady(true);
    };
    setupApp();
  }, []);

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (!appReady) {
    return null; // Show splash screen while initializing
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
