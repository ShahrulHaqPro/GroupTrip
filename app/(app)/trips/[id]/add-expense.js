import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Appbar,
  TextInput,
  Button,
  Text,
  HelperText,
  Checkbox,
  Snackbar,
  Divider,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import useAuthStore from "../../../../src/store/authStore";
import useTripStore from "../../../../src/store/tripStore";

export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { members, fetchMembers, addExpense } = useTripStore();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(user.id);
  const [splitAmong, setSplitAmong] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState("");

  useEffect(() => {
    if (id) fetchMembers(id);
  }, [id]);

  // Default: split among all members
  useEffect(() => {
    if (members.length > 0 && splitAmong.length === 0) {
      setSplitAmong(members.map((m) => m.id));
    }
  }, [members]);

  const toggleSplit = (memberId) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const validate = () => {
    const e = {};
    if (!description.trim()) e.description = "Description is required";
    if (!amount) e.amount = "Amount is required";
    else if (isNaN(Number(amount)) || Number(amount) <= 0)
      e.amount = "Enter a valid positive amount";
    if (splitAmong.length === 0)
      e.split = "Select at least one person to split with";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const perPerson =
    amount && splitAmong.length > 0
      ? (Number(amount) / splitAmong.length).toFixed(2)
      : "0.00";

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addExpense({
        trip_id: id,
        description: description.trim(),
        amount: Number(amount),
        paid_by: paidBy,
        split_among: splitAmong,
      });
      router.back();
    } catch (e) {
      setSnack(e.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Expense" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="labelLarge" style={styles.section}>
          Expense Details
        </Text>

        <TextInput
          label="Description *"
          value={description}
          onChangeText={(v) => {
            setDescription(v);
            setErrors((e) => ({ ...e, description: "" }));
          }}
          mode="outlined"
          left={<TextInput.Icon icon="receipt" />}
          error={!!errors.description}
          placeholder="e.g. Dinner at La Boqueria"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.description}>
          {errors.description}
        </HelperText>

        <TextInput
          label="Amount ($) *"
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setErrors((e) => ({ ...e, amount: "" }));
          }}
          mode="outlined"
          keyboardType="numeric"
          left={<TextInput.Icon icon="currency-usd" />}
          error={!!errors.amount}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.amount}>
          {errors.amount}
        </HelperText>

        <Text variant="labelLarge" style={styles.section}>
          Paid by
        </Text>
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberRow,
              paidBy === member.id && styles.selectedRow,
            ]}
            onPress={() => setPaidBy(member.id)}
          >
            <View
              style={[
                styles.radioCircle,
                paidBy === member.id && styles.radioSelected,
              ]}
            />
            <Text style={styles.memberName}>
              {member.name || member.email}
              {member.id === user.id ? " (you)" : ""}
            </Text>
          </TouchableOpacity>
        ))}

        <Text variant="labelLarge" style={styles.section}>
          Split among
        </Text>
        {errors.split ? (
          <HelperText type="error">{errors.split}</HelperText>
        ) : null}
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.checkRow}
            onPress={() => toggleSplit(member.id)}
          >
            <Checkbox
              status={splitAmong.includes(member.id) ? "checked" : "unchecked"}
              onPress={() => toggleSplit(member.id)}
              color="#6750A4"
            />
            <Text style={styles.memberName}>
              {member.name || member.email}
              {member.id === user.id ? " (you)" : ""}
            </Text>
          </TouchableOpacity>
        ))}

        {splitAmong.length > 0 && amount ? (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              ${perPerson} per person ({splitAmong.length}{" "}
              {splitAmong.length === 1 ? "person" : "people"})
            </Text>
          </View>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          icon="check"
        >
          Save Expense
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
  flex: { flex: 1, backgroundColor: "#F6F0FF" },
  appbarTitle: { fontWeight: "700" },
  container: { padding: 20, paddingBottom: 60 },
  section: {
    fontWeight: "700",
    color: "#1D1B20",
    marginTop: 16,
    marginBottom: 8,
  },
  input: { marginBottom: 2 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E7E0EC",
  },
  selectedRow: { borderColor: "#6750A4", backgroundColor: "#F3EAF7" },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9E9E9E",
    marginRight: 12,
  },
  radioSelected: { borderColor: "#6750A4", backgroundColor: "#6750A4" },
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  memberName: { fontSize: 15, color: "#1D1B20" },
  summary: {
    backgroundColor: "#EDE7F6",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
  },
  summaryText: { color: "#6750A4", fontWeight: "700", fontSize: 15 },
  saveBtn: { marginTop: 24, borderRadius: 28 },
  saveBtnContent: { paddingVertical: 8 },
});
