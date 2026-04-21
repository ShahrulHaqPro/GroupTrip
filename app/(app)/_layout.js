import { Stack, router } from "expo-router";
import { useEffect } from "react";
import useAuthStore from "../../src/store/authStore";

export default function AppLayout() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/login");
    }
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="trips/index" />
      <Stack.Screen name="trips/create" />
      <Stack.Screen name="trips/[id]/index" />
      <Stack.Screen name="trips/[id]/add-activity" />
      <Stack.Screen name="trips/[id]/add-expense" />
      <Stack.Screen name="trips/[id]/suggestions" />
    </Stack>
  );
}
