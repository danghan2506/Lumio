import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import { images } from "@/constants/images";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL("auth/reset-password"),
    });

    setLoading(false);

    if (error) {
      setErrorMessage(
        error.message?.includes("rate limit")
          ? "Too many requests. Please wait a moment and try again."
          : "Something went wrong. Please try again.",
      );
      return;
    }
    setSubmitted(true);
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
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image
            source={images.welcome}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 12,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 24,
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.cream,
              marginBottom: 6,
            }}
          >
            Reset your password 🔑
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.lavenderMist,
              textAlign: "center",
            }}
          >
            Enter your email and {"we'll"} send you a reset link.
          </Text>
        </View>

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
          {submitted ? (
            <>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "PlusJakartaSans_500Medium",
                  color: colors.cream,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                If an account exists for this email, {"we've"} sent a reset link.
              </Text>
              <Pressable
                onPress={() => router.replace("/(auth)/login" as Href)}
                style={{
                  backgroundColor: colors.lumioCoral,
                  borderRadius: 9999,
                  minHeight: 52,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.cream,
                  }}
                >
                  Back to sign in
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  color: colors.slate,
                  marginBottom: 6,
                }}
              >
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(94, 90, 128, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
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
                onPress={handleSubmit}
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
                    Send reset link
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: "center", marginTop: 20 }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: colors.slate,
            }}
          >
            Back
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
