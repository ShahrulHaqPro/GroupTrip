// AI-powered activity suggestion screen using Groq Cloud.
import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import {
  Appbar,
  Text,
  Button,
  Card,
  Chip,
  ActivityIndicator,
  Snackbar,
  Surface,
  useTheme,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../../../src/store/authStore";
import useTripStore from "../../../../src/store/tripStore";
import { suggestActivities } from "../../../../src/services/aiService";

const TIME_COLORS = {
  Morning: { bg: "#FFF8E1", text: "#F57F17" },
  Afternoon: { bg: "#E3F2FD", text: "#1565C0" },
  Evening: { bg: "#EDE7F6", text: "#4527A0" },
};

export default function SuggestionsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { currentTrip, addActivity, setCurrentTrip } = useTripStore();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState({}); // activityIndex → boolean
  const [added, setAdded] = useState({}); // activityIndex → boolean
  const [snack, setSnack] = useState("");

  useEffect(() => {
    if (!currentTrip && id) setCurrentTrip(id);
  }, [id]);

  const fetchSuggestions = async () => {
    if (!currentTrip) return;
    setLoading(true);
    setSuggestions([]);
    setAdded({});
    try {
      const results = await suggestActivities(
        currentTrip.destination,
        currentTrip.start_date,
        currentTrip.end_date
      );
      setSuggestions(results);
    } catch (e) {
      setSnack("Failed to get suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTrip) fetchSuggestions();
  }, [currentTrip?.id]);

  const handleAddActivity = async (suggestion, index) => {
    setAdding((prev) => ({ ...prev, [index]: true }));
    try {
      // Map AI suggestion fields to our activity schema
      await addActivity({
        trip_id: id,
        name: suggestion.name,
        datetime: null, // user can set later
        address: null,
        lat: null,
        lng: null,
        notes: `${suggestion.description}\n\nSuggested time: ${suggestion.suggested_time_of_day}\nApprox. cost: ${suggestion.approximate_cost}`,
        cost: null,
        created_by: user.id,
      });
      setAdded((prev) => ({ ...prev, [index]: true }));
      setSnack(`"${suggestion.name}" added to itinerary!`);
    } catch (e) {
      setSnack("Failed to add activity");
    } finally {
      setAdding((prev) => ({ ...prev, [index]: false }));
    }
  };

  const renderSuggestion = ({ item, index }) => {
    const timeStyle =
      TIME_COLORS[item.suggested_time_of_day] || TIME_COLORS.Afternoon;
    const isAdded = !!added[index];
    const isAdding = !!adding[index];

    return (
      <Card style={[styles.card, isAdded && styles.addedCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text
              variant="titleMedium"
              style={styles.suggestionName}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Chip
              compact
              style={[styles.timeChip, { backgroundColor: timeStyle.bg }]}
              textStyle={[styles.timeChipText, { color: timeStyle.text }]}
            >
              {item.suggested_time_of_day}
            </Chip>
          </View>

          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.meta}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>{item.approximate_cost}</Text>
          </View>

          {isAdded ? (
            <View style={styles.addedRow}>
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              <Text style={styles.addedText}>Added to itinerary</Text>
            </View>
          ) : (
            <Button
              mode="contained-tonal"
              onPress={() => handleAddActivity(item, index)}
              loading={isAdding}
              disabled={isAdding}
              icon="plus"
              style={styles.addBtn}
              compact
            >
              Add to Itinerary
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title="AI Suggestions"
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action
          icon="refresh"
          onPress={fetchSuggestions}
          disabled={loading}
        />
      </Appbar.Header>

      {/* Header info */}
      <Surface
        style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]}
        elevation={1}
      >
        <Ionicons name="hardware-chip-outline" size={28} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700" }}>
            Powered by Groq AI
          </Text>
          <Text style={[styles.bannerText, { color: theme.colors.onSurfaceVariant }]}>
            Suggestions for {currentTrip?.destination || "your trip"} ·{" "}
            {currentTrip?.start_date} to {currentTrip?.end_date}
          </Text>
        </View>
      </Surface>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Generating ideas with AI...</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderSuggestion}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bulb-outline" size={56} color={theme.colors.primary} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No suggestions yet</Text>
              <Button
                mode="contained"
                onPress={fetchSuggestions}
                style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
              >
                Get Suggestions
              </Button>
            </View>
          }
        />
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
  appbarTitle: { fontWeight: "700" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  bannerText: { fontSize: 12, marginTop: 2 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 15 },
  list: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 12, borderRadius: 14, elevation: 2 },
  addedCard: { opacity: 0.8, borderLeftWidth: 4, borderLeftColor: "#2E7D32" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  suggestionName: { fontWeight: "700", flex: 1 },
  timeChip: {maxHeight: 28, alignSelf: "flex-start", maxWidth: 120 },
  timeChipText: { fontSize: 10, fontWeight: "600",padding: 0, margin: 0,},
  description: { fontSize: 13, marginTop: 8, lineHeight: 20 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  metaText: { fontSize: 12 },
  addBtn: { marginTop: 12, alignSelf: "flex-start" },
  addedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  addedText: { color: "#2E7D32", fontWeight: "600", fontSize: 13 },
  empty: { alignItems: "center", marginTop: 80, padding: 24 },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 20,
  },
  retryBtn: {},
});
