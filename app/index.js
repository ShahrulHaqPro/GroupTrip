// Redirect to auth or app based on session.
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import useAuthStore from "../src/store/authStore";

export default function Index() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F6F0FF",
        }}
      >
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  return <Redirect href={user ? "/(app)/trips" : "/(auth)/login"} />;
}
