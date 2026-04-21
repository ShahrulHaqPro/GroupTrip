// Main trip detail screen with 4 tabs -> Itinerary, Map, Expenses, Members.
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";
import {
  Appbar,
  Text,
  FAB,
  Button,
  Chip,
  Snackbar,
  useTheme,
  Avatar,
  Surface,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import MapView, { Marker, UrlTile } from "react-native-maps";

import useAuthStore from "../../../../src/store/authStore";
import useTripStore from "../../../../src/store/tripStore";
import ActivityCard from "../../../../src/components/ActivityCard";
import ExpenseCard from "../../../../src/components/ExpenseCard";
import {
  subscribeToActivities,
  subscribeToExpenses,
} from "../../../../src/services/supabase";

const TABS = ["Itinerary", "Map", "Expenses", "Members"];

export default function TripDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuthStore();
  const {
    currentTrip,
    members,
    activities,
    expenses,
    loading,
    activitiesLoading,
    expensesLoading,
    setCurrentTrip,
    fetchMembers,
    fetchActivities,
    fetchExpenses,
    castVote,
    deleteVote,
    removeActivity,
    removeExpense,
    computeBalances,
    refreshActivities,
  } = useTripStore();

  const [activeTab, setActiveTab] = useState(0);
  const [snack, setSnack] = useState("");
  const channelRef = useRef(null);
  const expChannelRef = useRef(null);

  // Load trip data on mount
  useEffect(() => {
    if (!id) return;
    setCurrentTrip(id);
    fetchMembers(id);
    fetchActivities(id);
    fetchExpenses(id);

    // Subscribe to realtime
    channelRef.current = subscribeToActivities(id, () => {
      fetchActivities(id);
    });
    expChannelRef.current = subscribeToExpenses(id, () => {
      fetchExpenses(id);
    });

    return () => {
      channelRef.current?.unsubscribe();
      expChannelRef.current?.unsubscribe();
    };
  }, [id]);

  const onRefresh = useCallback(() => {
    fetchActivities(id);
    fetchExpenses(id);
    fetchMembers(id);
  }, [id]);

  const handleVote = async (activityId, voteValue) => {
    if (voteValue === 0) {
      await deleteVote(activityId, user.id);
    } else {
      await castVote(activityId, user.id, voteValue);
    }
  };

  const handleDeleteActivity = (activity) => {
    if (activity.created_by !== user.id) {
      setSnack("You can only delete your own activities");
      return;
    }
    Alert.alert("Delete Activity", `Remove "${activity.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeActivity(activity.id),
      },
    ]);
  };

  const handleDeleteExpense = (expense) => {
    if (expense.paid_by !== user.id) {
      setSnack("You can only delete your own expenses");
      return;
    }
    Alert.alert("Delete Expense", `Remove "${expense.description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeExpense(expense.id),
      },
    ]);
  };

  const copyInviteCode = async () => {
    if (currentTrip?.invite_code) {
      await Clipboard.setStringAsync(currentTrip.invite_code);
      setSnack(`Invite code copied: ${currentTrip.invite_code}`);
    }
  };

  // ─── Tab content ──────────────────────────────────────────────────────────

  const renderItinerary = () => (
    <FlatList
      data={activities}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ActivityCard
          activity={item}
          userId={user.id}
          onVote={handleVote}
          onPress={() => {}}
          onDelete={() => handleDeleteActivity(item)}
        />
      )}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={activitiesLoading} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        !activitiesLoading ? (
          <View style={styles.emptyTab}>
            <Ionicons name="calendar-outline" size={56} color={theme.colors.primary} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No activities yet</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
              Add your first activity or get AI suggestions
            </Text>
          </View>
        ) : null
      }
    />
  );

  const renderMap = () => {
    const mapActivities = activities.filter((a) => a.lat && a.lng);
    const initialRegion =
      mapActivities.length > 0
        ? {
            latitude: Number(mapActivities[0].lat),
            longitude: Number(mapActivities[0].lng),
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }
        : {
            latitude: 20,
            longitude: 0,
            latitudeDelta: 60,
            longitudeDelta: 60,
          };

    return (
      <View style={styles.mapContainer}>
        {mapActivities.length === 0 ? (
          <View style={styles.emptyTab}>
            <Ionicons name="map-outline" size={56} color={theme.colors.primary} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No locations set</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
              Activities with lat/lng appear here
            </Text>
          </View>
        ) : (
          <MapView style={styles.map} initialRegion={initialRegion}>
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {mapActivities.map((a) => (
              <Marker
                key={a.id}
                coordinate={{
                  latitude: Number(a.lat),
                  longitude: Number(a.lng),
                }}
                title={a.name}
                description={a.address || ""}
                pinColor={theme.colors.primary}
              />
            ))}
          </MapView>
        )}
      </View>
    );
  };

  const renderExpenses = () => {
    const balances = computeBalances();
    const myBalance = balances[user.id] || 0;

    return (
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            members={members}
            userId={user.id}
            onDelete={() => handleDeleteExpense(item)}
          />
        )}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={expensesLoading} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Surface style={styles.balanceCard} elevation={2}>
            <Text variant="labelLarge" style={styles.balanceLabel}>
              Your Balance
            </Text>
            <Text
              variant="headlineMedium"
              style={[
                styles.balanceAmount,
                { color: myBalance >= 0 ? "#2E7D32" : "#C62828" },
              ]}
            >
              {myBalance >= 0 ? "+" : ""}${Math.abs(myBalance).toFixed(2)}
            </Text>
            <Text style={[styles.balanceHint, { color: theme.colors.onSurfaceVariant }]}>
              {myBalance > 0
                ? "Others owe you"
                : myBalance < 0
                ? "You owe the group"
                : "All settled up ✓"}
            </Text>
          </Surface>
        }
        ListEmptyComponent={
          !expensesLoading ? (
            <View style={styles.emptyTab}>
              <Ionicons name="receipt-outline" size={56} color={theme.colors.primary} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No expenses yet</Text>
              <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
                Log shared costs to track who owes what
              </Text>
            </View>
          ) : null
        }
      />
    );
  };

  const renderMembers = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Invite code */}
      <Surface style={[styles.inviteCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Text variant="labelLarge" style={{ marginBottom: 4 }}>
          Invite Code
        </Text>
        <View style={styles.inviteRow}>
          <Text variant="displaySmall" style={[styles.inviteCode, { color: theme.colors.primary }]}>
            {currentTrip?.invite_code || "------"}
          </Text>
          <Button
            mode="contained-tonal"
            icon="content-copy"
            onPress={copyInviteCode}
            compact
          >
            Copy
          </Button>
        </View>
        <Text style={[styles.inviteHint, { color: theme.colors.onSurfaceVariant }]}>
          Share this code so others can join
        </Text>
      </Surface>

      <Text variant="titleMedium" style={styles.membersHeader}>
        Members ({members.length})
      </Text>

      {members.map((member) => (
        <View key={member.id} style={styles.memberRow}>
          <Avatar.Text
            size={44}
            label={(member.name || member.email || "U")
              .slice(0, 2)
              .toUpperCase()}
            style={[styles.memberAvatar, { backgroundColor: theme.colors.primaryContainer }]}
          />
          <View style={styles.memberInfo}>
            <Text variant="bodyLarge" style={{ fontWeight: "600" }}>
              {member.name || member.email}
            </Text>
            <Text style={[styles.memberEmail, { color: theme.colors.onSurfaceVariant }]}>{member.email}</Text>
          </View>
          <Chip compact style={[styles.roleChip, { backgroundColor: theme.colors.secondaryContainer }]}>
            {member.role}
          </Chip>
        </View>
      ))}
    </ScrollView>
  );

  // ─── FAB actions per tab ──────────────────────────────────────────────────

  const fabActions = [
    // Itinerary tab
    [
      {
        icon: "plus",
        label: "Add activity",
        onPress: () => router.push(`/(app)/trips/${id}/add-activity`),
      },
      {
        icon: "robot-outline",
        label: "AI Suggestions",
        onPress: () => router.push(`/(app)/trips/${id}/suggestions`),
      },
    ],
    [], // Map – no FAB
    [
      {
        icon: "plus",
        label: "Add expense",
        onPress: () => router.push(`/(app)/trips/${id}/add-expense`),
      },
    ],
    [], // Members – no FAB
  ];

  const currentFABs = fabActions[activeTab];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={currentTrip?.title || "Trip"}
          subtitle={currentTrip?.destination}
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>

      {/* Tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === i && styles.activeTab,
              activeTab === i && { borderBottomColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab(i)}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.onSurfaceVariant },
                activeTab === i && styles.activeTabText,
                activeTab === i && { color: theme.colors.primary },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={styles.flex}>
        {activeTab === 0 && renderItinerary()}
        {activeTab === 1 && renderMap()}
        {activeTab === 2 && renderExpenses()}
        {activeTab === 3 && renderMembers()}
      </View>

      {/* FAB(s) */}
      {currentFABs.length === 1 && (
        <FAB
          icon={currentFABs[0].icon}
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={currentFABs[0].onPress}
          label={currentFABs[0].label}
        />
      )}
      {currentFABs.length === 2 && (
        <View style={styles.fabGroup}>
          <FAB
            icon={currentFABs[1].icon}
            style={[styles.fabSecondary, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={currentFABs[1].onPress}
            size="small"
          />
          <FAB
            icon={currentFABs[0].icon}
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={currentFABs[0].onPress}
          />
        </View>
      )}

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  appbarTitle: { fontWeight: "700", fontSize: 18 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {},
  tabText: { fontSize: 13, fontWeight: "500" },
  activeTabText: { fontWeight: "700" },
  tabContent: { paddingBottom: 120, paddingTop: 8 },
  emptyTab: { alignItems: "center", marginTop: 60, padding: 24 },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubText: {
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  // Map
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  // Expenses
  balanceCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: { marginBottom: 4 },
  balanceAmount: { fontWeight: "800" },
  balanceHint: { marginTop: 4, fontSize: 13 },
  // Members
  inviteCard: { margin: 16, borderRadius: 16, padding: 20, marginBottom: 8 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  inviteCode: {
    fontWeight: "800",
    letterSpacing: 6,
    fontSize: 28,
  },
  inviteHint: { fontSize: 12 },
  membersHeader: {
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  memberAvatar: {},
  memberInfo: { flex: 1 },
  memberEmail: { fontSize: 12 },
  roleChip: {},
  // FAB
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
  },
  fabGroup: {
    position: "absolute",
    right: 16,
    bottom: 24,
    alignItems: "center",
    gap: 12,
  },
  fabSecondary: {
    position: "absolute",
    right: 22,
    bottom: 90,
  },
});
