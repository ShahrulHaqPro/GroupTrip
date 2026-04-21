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
  Snackbar,
  useTheme,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../../../src/store/authStore";
import useTripStore from "../../../../src/store/tripStore";

export default function AddActivityScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { addActivity } = useTripStore();

  const [name, setName] = useState("");
  const [datetime, setDatetime] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState("");

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Activity name is required";
    if (datetime && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(datetime))
      e.datetime = "Use ISO format: YYYY-MM-DDTHH:MM";
    if (lat && isNaN(Number(lat))) e.lat = "Latitude must be a number";
    if (lng && isNaN(Number(lng))) e.lng = "Longitude must be a number";
    if (cost && isNaN(Number(cost))) e.cost = "Cost must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addActivity({
        trip_id: id,
        name: name.trim(),
        datetime: datetime || null,
        address: address.trim() || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        notes: notes.trim() || null,
        cost: cost ? Number(cost) : null,
        created_by: user.id,
      });
      router.back();
    } catch (e) {
      setSnack(e.message || "Failed to save activity");
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
        <Appbar.Content title="Add Activity" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurface }]}> 
          Basic Info
        </Text>

        <TextInput
          label="Activity name *"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErrors((e) => ({ ...e, name: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="calendar-star" />}
          error={!!errors.name}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.name}>
          {errors.name}
        </HelperText>

        <TextInput
          label="Date & time"
          value={datetime}
          onChangeText={(v) => {
            setDatetime(v);
            setErrors((e) => ({ ...e, datetime: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="clock-outline" />}
          placeholder="2025-07-15T14:00"
          error={!!errors.datetime}
          style={styles.input}
        />
        <HelperText type={errors.datetime ? "error" : "info"} visible={true}>
          {errors.datetime ||
            "Format: YYYY-MM-DDTHH:MM (e.g. 2025-07-15T14:00)"}
        </HelperText>

        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurface }]}> 
          Location
        </Text>

        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          left={<TextInput.Icon icon="map-marker-outline" />}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput
              label="Latitude"
              value={lat}
              onChangeText={(v) => {
                setLat(v);
                setErrors((e) => ({ ...e, lat: "" }));
              }}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.lat}
              placeholder="41.3851"
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.lat}>
              {errors.lat}
            </HelperText>
          </View>
          <View style={styles.half}>
            <TextInput
              label="Longitude"
              value={lng}
              onChangeText={(v) => {
                setLng(v);
                setErrors((e) => ({ ...e, lng: "" }));
              }}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.lng}
              placeholder="2.1734"
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.lng}>
              {errors.lng}
            </HelperText>
          </View>
        </View>

        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurface }]}> 
          Details
        </Text>

        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={<TextInput.Icon icon="note-outline" />}
          style={styles.input}
        />

        <TextInput
          label="Estimated cost ($)"
          value={cost}
          onChangeText={(v) => {
            setCost(v);
            setErrors((e) => ({ ...e, cost: "" }));
          }}
          mode="outlined"
          keyboardType="numeric"
          left={
            <TextInput.Icon
              icon={() => (
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
            />
          }
          // left={<TextInput.Icon icon="cash-outline" />}
          error={!!errors.cost}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.cost}>
          {errors.cost}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          icon="check"
        >
          Save Activity
        </Button>
      </ScrollView>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack("")}
        duration={3000}
      >
        {snack}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appbarTitle: { fontWeight: "700" },
  container: { padding: 20, paddingBottom: 60 },
  section: {
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
  },
  input: { marginBottom: 2 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  saveBtn: { marginTop: 24, borderRadius: 28 },
  saveBtnContent: { paddingVertical: 8 },
});
