import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Appbar,
  TextInput,
  Button,
  Text,
  HelperText,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { format } from "date-fns";
import useAuthStore from "../../../src/store/authStore";
import useTripStore from "../../../src/store/tripStore";

export default function CreateTripScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { addTrip } = useTripStore();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Trip title is required";
    if (!destination.trim()) e.destination = "Destination is required";
    if (!startDate) e.startDate = "Start date required (YYYY-MM-DD)";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))
      e.startDate = "Use format YYYY-MM-DD";
    if (!endDate) e.endDate = "End date required (YYYY-MM-DD)";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      e.endDate = "Use format YYYY-MM-DD";
    else if (startDate && endDate && endDate < startDate)
      e.endDate = "End must be after start";
    if (budget && isNaN(Number(budget))) e.budget = "Budget must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    if (!user?.id) {
      setErrors({ general: "Sign in again before creating a trip." });
      return;
    }
    setLoading(true);
    try {
      const trip = await addTrip(
        {
          title: title.trim(),
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
          budget: budget ? Number(budget) : null,
        },
        user.id
      );
      router.replace(`/(app)/trips/${trip.id}`);
    } catch (e) {
      setErrors({ general: e?.message || "Failed to create trip." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="New Trip" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="headlineSmall"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          Trip Details
        </Text>

        {errors.general ? (
          <HelperText type="error" style={styles.generalError}>
            {errors.general}
          </HelperText>
        ) : null}

        <TextInput
          label="Trip title *"
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            setErrors((e) => ({ ...e, title: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="text" />}
          error={!!errors.title}
          placeholder="e.g. Barcelona Summer 2025"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.title}>
          {errors.title}
        </HelperText>

        <TextInput
          label="Destination *"
          value={destination}
          onChangeText={(v) => {
            setDestination(v);
            setErrors((e) => ({ ...e, destination: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="map-marker-outline" />}
          error={!!errors.destination}
          placeholder="e.g. Barcelona, Spain"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.destination}>
          {errors.destination}
        </HelperText>

        <Text
          variant="labelLarge"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          Dates
        </Text>

        <TextInput
          label="Start date *"
          value={startDate}
          onChangeText={(v) => {
            setStartDate(v);
            setErrors((e) => ({ ...e, startDate: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="calendar-start" />}
          error={!!errors.startDate}
          placeholder="YYYY-MM-DD"
          // keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.startDate}>
          {errors.startDate}
        </HelperText>

        <TextInput
          label="End date *"
          value={endDate}
          onChangeText={(v) => {
            setEndDate(v);
            setErrors((e) => ({ ...e, endDate: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="calendar-end" />}
          error={!!errors.endDate}
          placeholder="YYYY-MM-DD"
          // keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.endDate}>
          {errors.endDate}
        </HelperText>

        <Text
          variant="labelLarge"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          Optional
        </Text>

        <TextInput
          label="Budget (total $)"
          value={budget}
          onChangeText={(v) => {
            setBudget(v);
            setErrors((e) => ({ ...e, budget: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="wallet-outline" />}
          error={!!errors.budget}
          placeholder="e.g. 2000"
          keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.budget}>
          {errors.budget}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={styles.createBtn}
          contentStyle={styles.createBtnContent}
          icon="airplane-takeoff"
        >
          Create Trip
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appbarTitle: { fontWeight: "700" },
  container: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  input: { marginBottom: 2 },
  generalError: { fontSize: 14, marginBottom: 8 },
  createBtn: { marginTop: 24, borderRadius: 28 },
  createBtnContent: { paddingVertical: 8 },
});
