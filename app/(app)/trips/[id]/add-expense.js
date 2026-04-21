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
  useTheme,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import useAuthStore from "../../../../src/store/authStore";
import useTripStore from "../../../../src/store/tripStore";

export default function AddExpenseScreen() {
  const theme = useTheme();
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
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Expense" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurface }]}> 
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

        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurface }]}> 
          Paid by
        </Text>
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
              paidBy === member.id && styles.selectedRow,
              paidBy === member.id && {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.secondaryContainer,
              },
            ]}
            onPress={() => setPaidBy(member.id)}
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: theme.colors.outline },
                paidBy === member.id && styles.radioSelected,
                paidBy === member.id && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
            <Text style={[styles.memberName, { color: theme.colors.onSurface }]}>
              {member.name || member.email}
              {member.id === user.id ? " (you)" : ""}
            </Text>
          </TouchableOpacity>
        ))}

        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurface }]}> 
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
              color={theme.colors.primary}
            />
            <Text style={[styles.memberName, { color: theme.colors.onSurface }]}>
              {member.name || member.email}
              {member.id === user.id ? " (you)" : ""}
            </Text>
          </TouchableOpacity>
        ))}

        {splitAmong.length > 0 && amount ? (
          <View
            style={[
              styles.summary,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <Text style={[styles.summaryText, { color: theme.colors.primary }]}> 
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
  flex: { flex: 1 },
  appbarTitle: { fontWeight: "700" },
  container: { padding: 20, paddingBottom: 60 },
  section: {
    fontWeight: "700",
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
    borderWidth: 1,
  },
  selectedRow: {},
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
  },
  radioSelected: {},
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  memberName: { fontSize: 15 },
  summary: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
  },
  summaryText: { fontWeight: "700", fontSize: 15 },
  saveBtn: { marginTop: 24, borderRadius: 28 },
  saveBtnContent: { paddingVertical: 8 },
});
