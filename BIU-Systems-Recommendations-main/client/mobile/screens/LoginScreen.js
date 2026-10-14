// @ts-check

// Login screen. The user enters their username and password.
// On submit: validate each field with its own validator, then POST/api/tokens.
// The server returns a JWT, which is stored in AuthContext.
// Every failed login shows the same generic message.


import { useState } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity
} from "react-native";
import { router } from "expo-router";
import get_stylesheet from "../styles/LoginScreen.styles"
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../utils/api";
import Textfield from "../components/TextField";
import Passwordfield from "../components/PasswordField";
// @ts-ignore
import woltLogo from "../assets/wolt-logo.png";
import ContinueButton from "../components/ContinueButton";

// Each field owns its validator. Login stays lenient on purpose.
// it only requires the fields to be filled in.
/** @type {Record<"username" | "password", (v: string) => string | null>} */
const validators = {
  username: (v) => (v.trim() ? null : "Please enter your username."),
  password: (v) => (v ? null : "Please enter your password."),
};

export default function LoginScreen() {
  const styles = get_stylesheet(useTheme());
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState(
    /** @type {Record<string, string>} */({})
  );

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * @param {"username" | "password"} field
   * @param {string} value
   */
  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }
  }

  /** @param {"username" | "password"} field */
  function handleBlur(field) {
    const error = validators[field](form[field]);

    setErrors((prev) => ({
      ...prev,
      [field]: error || "",
    }));
  }

  async function handleSubmit() {
    setServerError("");

    const nextErrors = /** @type {Record<string, string>} */ ({});

    for (const field of /** @type {Array<"username" | "password">} */ ([
      "username",
      "password",
    ])) {
      const error = validators[field](form[field]);
      if (error) nextErrors[field] = error;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    let res;

    try {
      res = await api.login({
        username: form.username.trim(),
        password: form.password,
      });

    } catch {
      setServerError("Cannot reach the server. Check your connection.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (!res.ok) {
      setServerError("Invalid username or password.");
      return;
    }

    const data = await res.json();

    login(data.token, {
      username: form.username.trim(),
    });

    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Image source={woltLogo} style={styles.logo} />

          <Text style={styles.heading}>Log in to Wolt</Text>

          <Textfield
            label="Enter your username"
            value={form.username}
            onChangeText={(text) => handleChange("username", text)}
            onBlur={() => handleBlur("username")}
            error={errors.username}
            hint="The username for your account."
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Passwordfield
            label="Enter your password"
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
            onBlur={() => handleBlur("password")}
            error={errors.password}
            hint="The password for your account."
            placeholder="Password"
          />
          {serverError ? (
            <Text style={styles.serverError}>
              {serverError}
            </Text>
          ) : null}

          <ContinueButton
            onPress={handleSubmit}
            loading={loading}
          />

          <Text style={styles.altText}>
            Don't have an account?{" "}
            <Text
              style={styles.link}
              onPress={() => router.push("/register")}
            >
              Create account
            </Text>
          </Text>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace("/?guest=true")}
          >
            <Text style={styles.guestButtonText}>Continue as guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView >
  );
}