import { supabase } from "@/lib/supabase";
import { parseAuthTokens } from "@/lib/authCallback";
import { colors } from "@/theme/colors";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<"loading" | "ready" | "invalid">(
    "loading",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let established = false;

    const establishSession = async (url: string | null) => {
      if (cancelled || established) return;
      const tokens = url ? parseAuthTokens(url) : null;
      if (!tokens) {
        // Cold start without a link: stay in loading and wait for a
        // warm-start link event instead of showing a false invalid state.
        if (url === null) return;
        setLinkState("invalid");
        return;
      }
      const { error } = await supabase.auth.setSession(tokens);
      if (cancelled || established) return;
      if (error) {
        setLinkState("invalid");
        return;
      }
      established = true;
      setLinkState("ready");
    };

    Linking.getInitialURL().then((url) => establishSession(url));
    const subscription = Linking.addEventListener("url", ({ url }) => {
      establishSession(url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const handleUpdate = async () => {
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrorMessage("Could not update the password. Please try again.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.replace("/(auth)/login" as Href), 1500);
  };

  const inputStyle = {
    backgroundColor: "rgba(234, 230, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(94, 90, 128, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.cream,
    minHeight: 48,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {linkState === "loading" && (
          <ActivityIndicator size="large" color={colors.lumioCoral} />
        )}

        {linkState === "invalid" && (
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.cream,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              This reset link is invalid or has expired.
            </Text>
            <Pressable
              onPress={() =>
                router.replace("/(auth)/forgot-password" as Href)
              }
              style={{
                backgroundColor: colors.lumioCoral,
                borderRadius: 9999,
                minHeight: 52,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.cream,
                }}
              >
                Request a new link
              </Text>
            </Pressable>
          </View>
        )}

        {linkState === "ready" && (
          <View
            style={{
              width: "100%",
              backgroundColor: "rgba(234, 230, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(94, 90, 128, 0.2)",
              borderRadius: 24,
              padding: 20,
            }}
          >
            {success ? (
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.cream,
                  textAlign: "center",
                }}
              >
                Password updated! 🎉
              </Text>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.cream,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  Set a new password
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    color: colors.slate,
                    marginBottom: 6,
                  }}
                >
                  New password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  placeholderTextColor="rgba(94, 90, 128, 0.5)"
                  secureTextEntry
                  style={{ ...inputStyle, marginBottom: 12 }}
                />

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    color: colors.slate,
                    marginBottom: 6,
                  }}
                >
                  Confirm new password
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(94, 90, 128, 0.5)"
                  secureTextEntry
                  style={{ ...inputStyle, marginBottom: 12 }}
                />

                {errorMessage && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 107, 87, 0.15)",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.lumioCoral,
                        fontSize: 14,
                        fontFamily: "PlusJakartaSans_500Medium",
                      }}
                    >
                      {errorMessage}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={handleUpdate}
                  disabled={loading}
                  style={{
                    backgroundColor: colors.lumioCoral,
                    borderRadius: 9999,
                    minHeight: 52,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.cream} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "PlusJakartaSans_700Bold",
                        color: colors.cream,
                      }}
                    >
                      Update password
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
