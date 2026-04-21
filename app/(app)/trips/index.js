// Main screen: shows all the user's trips and lets them create/join trips.
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  FAB,
  Appbar,
  Portal,
  Modal,
  TextInput,
  Button,
  Snackbar,
  Card,
  Chip,
  ActivityIndicator,
} from "react-native-paper";

import { router } from "expo-router";
import { format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import useAuthStore from "../../../src/store/authStore";
import useTripStore from "../../../src/store/tripStore";
import useThemeStore from "../../../src/store/themeStore";

export default function TripsScreen() {
  const theme = useTheme();
  const { user, profile, logout } = useAuthStore();
  const { trips, loading, fetchTrips, joinTrip } = useTripStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [joinVisible, setJoinVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [snack, setSnack] = useState("");

  useEffect(() => {
    if (user) fetchTrips(user.id);
  }, [user]);

  const onRefresh = useCallback(() => {
    if (user) fetchTrips(user.id);
  }, [user]);

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      await joinTrip(inviteCode.trim(), user.id);
      setJoinVisible(false);
      setInviteCode("");
      setSnack("Joined trip successfully! 🎉");
    } catch (e) {
      setSnack(e.message || "Failed to join trip");
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const statusColor = (trip) => {
    const now = new Date();
    const start = parseISO(trip.start_date);
    const end = parseISO(trip.end_date);
    if (now < start) return { color: "#1565C0", label: "Upcoming" };
    if (now > end) return { color: "#757575", label: "Past" };
    return { color: "#2E7D32", label: "Active" };
  };

  const renderTrip = ({ item }) => {
    const status = statusColor(item);
    return (
      <TouchableOpacity onPress={() => router.push(`/(app)/trips/${item.id}`)}>
        <Card style={styles.tripCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleMedium"
                  style={dynamicStyles.tripTitle}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <View style={styles.destinationRow}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text style={dynamicStyles.destination}>{item.destination}</Text>
                </View>
              </View>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: status.color + "22" },
                ]}
                textStyle={[styles.statusText, { color: status.color }]}
              >
                {status.label}
              </Chip>
            </View>
            <View style={styles.dates}>
              <Ionicons name="calendar-outline" size={13} color={theme.colors.onSurfaceVariant} />
              <Text style={dynamicStyles.dateText}>
                {format(parseISO(item.start_date), "MMM d")} –{" "}
                {format(parseISO(item.end_date), "MMM d, yyyy")}
              </Text>
            </View>
            {item.budget ? (
              <View style={styles.dates}>
                <Ionicons name="wallet-outline" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={dynamicStyles.dateText}>
                  Budget: ${Number(item.budget).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const dynamicStyles = getDynamicStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="My Trips" titleStyle={styles.appbarTitle} />
        <Appbar.Action
          icon="login-variant"
          onPress={() => setJoinVisible(true)}
          tooltip="Join trip"
        />
        <Appbar.Action
          icon={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"}
          onPress={toggleTheme}
          tooltip={isDarkMode ? "Light mode" : "Dark mode"}
        />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      {loading && trips.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="airplane-outline" size={80} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={dynamicStyles.emptyTitle}>
            No trips yet
          </Text>
          <Text style={dynamicStyles.emptySubtitle}>
            Create a trip or join one with an invite code
          </Text>
          <Button
            mode="outlined"
            onPress={() => setJoinVisible(true)}
            style={styles.emptyBtn}
            icon="login-variant"
          >
            Join a trip
          </Button>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <Text style={dynamicStyles.greeting}>
              Hey {profile?.name?.split(" ")[0] || "traveller"} 👋
            </Text>
          }
        />
      )}

      {/* Join trip modal */}
      <Portal>
        <Modal
          visible={joinVisible}
          onDismiss={() => {
            setJoinVisible(false);
            setInviteCode("");
          }}
          contentContainerStyle={dynamicStyles.modal}
        >
            <Text variant="headlineSmall" style={dynamicStyles.modalTitle}>
            Join a Trip
          </Text>
          <Text style={dynamicStyles.modalSubtitle}>
            Enter the invite code shared by your group
          </Text>
          <TextInput
            label="Invite Code"
            value={inviteCode}
            onChangeText={(v) => setInviteCode(v.toUpperCase())}
            mode="outlined"
            autoCapitalize="characters"
            maxLength={6}
            style={styles.codeInput}
          />
          <View style={styles.modalBtns}>
            <Button onPress={() => setJoinVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleJoin}
              loading={joining}
              disabled={joining || !inviteCode.trim()}
            >
              Join
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={dynamicStyles.fab}
        onPress={() => router.push("/(app)/trips/create")}
        label="New trip"
      />

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack("")}
        duration={3000}
      >
        {snack}
      </Snackbar>
    </View>
  );
}

const getDynamicStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    greeting: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginVertical: 16,
      fontWeight: "500",
    },
    tripTitle: { fontWeight: "700", color: theme.colors.onSurface },
    destination: { fontSize: 13, color: theme.colors.onSurfaceVariant },
    dateText: { fontSize: 13, color: theme.colors.onSurfaceVariant },
    emptyTitle: { marginTop: 16, fontWeight: "700", color: theme.colors.onSurface },
    emptySubtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 22,
    },
    fab: {
      position: "absolute",
      right: 16,
      bottom: 24,
      backgroundColor: theme.colors.primary,
    },
    modal: {
      backgroundColor: theme.colors.surface,
      margin: 24,
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: { fontWeight: "700", marginBottom: 8, color: theme.colors.onSurface },
    modalSubtitle: { color: theme.colors.onSurfaceVariant, marginBottom: 16 },
  });

const styles = StyleSheet.create({
  container: { flex: 1 },
  appbarTitle: { fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  tripCard: { marginVertical: 6, borderRadius: 14, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusChip: { maxHeight: 30, alignSelf: "flex-start", maxWidth: 120 },
  statusText: { fontSize: 11, fontWeight: "600",padding: 0, margin: 0,},
  dates: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyBtn: { marginTop: 20 },
  codeInput: { marginBottom: 16, letterSpacing: 4, fontSize: 20 },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
});
