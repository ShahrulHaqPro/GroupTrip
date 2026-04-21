// Redirect to auth or app based on session.
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "react-native-paper";
import useAuthStore from "../src/store/authStore";

export default function Index() {
  const { user, loading } = useAuthStore();
  const theme = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={user ? "/(app)/trips" : "/(auth)/login"} />;
}
