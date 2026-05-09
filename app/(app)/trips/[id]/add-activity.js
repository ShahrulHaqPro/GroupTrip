import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import useAuthStore from "../../../../src/store/authStore";
import useTripStore from "../../../../src/store/tripStore";

export default function AddActivityScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { addActivity } = useTripStore();

  const [name, setName] = useState("");
  const [activityDate, setActivityDate] = useState(new Date());
  const [activityTime, setActivityTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState("");

  const mergeDateAndTime = (datePart, timePart) => {
    const merged = new Date(datePart);
    merged.setHours(timePart.getHours());
    merged.setMinutes(timePart.getMinutes());
    merged.setSeconds(0);
    merged.setMilliseconds(0);
    return merged;
  };

  const activityDateTime = mergeDateAndTime(activityDate, activityTime);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Activity name is required";
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
        datetime: format(activityDateTime, "yyyy-MM-dd'T'HH:mm"),
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
          label="Activity date"
          value={format(activityDate, "MMM d, yyyy")}
          mode="outlined"
          left={<TextInput.Icon icon="calendar" />}
          right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
          showSoftInputOnFocus={false}
          caretHidden
          onFocus={() => {
            Keyboard.dismiss();
            setShowDatePicker(true);
          }}
          style={styles.input}
        />

        <TextInput
          label="Activity time"
          value={format(activityTime, "hh:mm a")}
          mode="outlined"
          left={<TextInput.Icon icon="clock-outline" />}
          right={<TextInput.Icon icon="clock-outline" onPress={() => setShowTimePicker(true)} />}
          showSoftInputOnFocus={false}
          caretHidden
          onFocus={() => {
            Keyboard.dismiss();
            setShowTimePicker(true);
          }}
          style={styles.input}
        />
        <HelperText type="info" visible={true}>
          Pick a date and time using the popups.
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

      {showDatePicker ? (
        <DateTimePicker
          value={activityDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setActivityDate(selectedDate);
          }}
        />
      ) : null}

      {showTimePicker ? (
        <DateTimePicker
          value={activityTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setActivityTime(selectedTime);
          }}
        />
      ) : null}
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
