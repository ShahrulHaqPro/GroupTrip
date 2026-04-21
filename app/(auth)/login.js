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
} from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../src/store/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, loading, error, clearError } = useAuthStore();

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      router.replace("/(app)/trips");
    } catch {
      // error shown from store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="airplane" size={56} color="#6750A4" />
          <Text variant="displaySmall" style={styles.title}>
            GroupTrip
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Plan adventures together
          </Text>
        </View>

        {/* Form */}
        <Surface style={styles.form} elevation={2}>
          <Text variant="headlineSmall" style={styles.formTitle}>
            Welcome back
          </Text>

          {error ? (
            <HelperText type="error" style={styles.apiError}>
              {error}
            </HelperText>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({ ...e, email: "" }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
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

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginBtn}
            contentStyle={styles.loginBtnContent}
          >
            Sign In
          </Button>
        </Surface>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/register")}
          style={styles.link}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F6F0FF" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontWeight: "800", color: "#1D1B20", marginTop: 8 },
  subtitle: { color: "#49454F", marginTop: 4 },
  form: { borderRadius: 16, padding: 24 },
  formTitle: { fontWeight: "700", marginBottom: 16, color: "#1D1B20" },
  input: { marginBottom: 4 },
  apiError: { fontSize: 14, marginBottom: 8 },
  loginBtn: { marginTop: 8, borderRadius: 28 },
  loginBtnContent: { paddingVertical: 6 },
  link: { alignItems: "center", marginTop: 24 },
  linkText: { color: "#49454F" },
  linkBold: { color: "#6750A4", fontWeight: "700" },
});
