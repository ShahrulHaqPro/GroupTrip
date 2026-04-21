import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Surface,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../src/store/authStore";

export default function RegisterScreen() {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackVisible, setSnackVisible] = useState(false);

  const { register, loading, error, clearError } = useAuthStore();

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    if (password !== confirmPass) e.confirmPass = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    try {
      await register(email.trim(), password, name.trim());
      setSnackVisible(true);
      // Supabase may require email confirmation; redirect to login after a moment
      setTimeout(() => router.replace("/(auth)/login"), 2000);
    } catch {
      // error shown from store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Ionicons name="airplane" size={48} color={theme.colors.primary} />
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Create account
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Join GroupTrip and start planning
          </Text>
        </View>

        <Surface style={styles.form} elevation={2}>
          {error ? <HelperText type="error">{error}</HelperText> : null}

          <TextInput
            label="Full name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setErrors((e) => ({ ...e, name: "" }));
            }}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" />}
            error={!!errors.name}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <TextInput
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({ ...e, email: "" }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            left={<TextInput.Icon icon="email-outline" />}
            error={!!errors.email}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setErrors((e) => ({ ...e, password: "" }));
            }}
            secureTextEntry={!showPass}
            mode="outlined"
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPass ? "eye-off" : "eye"}
                onPress={() => setShowPass(!showPass)}
              />
            }
            error={!!errors.password}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          <TextInput
            label="Confirm password"
            value={confirmPass}
            onChangeText={(v) => {
              setConfirmPass(v);
              setErrors((e) => ({ ...e, confirmPass: "" }));
            }}
            secureTextEntry={!showPass}
            mode="outlined"
            left={<TextInput.Icon icon="lock-check-outline" />}
            error={!!errors.confirmPass}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.confirmPass}>
            {errors.confirmPass}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Create Account
          </Button>
        </Surface>

        <TouchableOpacity onPress={() => router.back()} style={styles.link}>
          <Text style={[styles.linkText, { color: theme.colors.onSurfaceVariant }] }>
            Already have an account?{" "}
            <Text style={[styles.linkBold, { color: theme.colors.primary }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
      >
        Account created! Check your email to confirm, then sign in.
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24 },
  header: { alignItems: "center", marginVertical: 24 },
  backBtn: { position: "absolute", left: 0, top: 0 },
  title: { fontWeight: "700", marginTop: 8 },
  subtitle: { marginTop: 4 },
  form: { borderRadius: 16, padding: 24 },
  input: { marginBottom: 4 },
  btn: { marginTop: 8, borderRadius: 28 },
  btnContent: { paddingVertical: 6 },
  link: { alignItems: "center", marginTop: 20 },
  linkText: {},
  linkBold: { fontWeight: "700" },
});
