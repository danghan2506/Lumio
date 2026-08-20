import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

// Required for OAuth flow to complete on mobile
WebBrowser.maybeCompleteAuthSession();

export function SocialAuthGroup() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL("auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert("Authentication Error", error.message);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        if (result.type === "success" && result.url) {
          // Extract tokens from callback URL and set session
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.slice(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      Alert.alert("Error", "Google sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      {/* Divider */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: "rgba(94, 90, 128, 0.25)",
          }}
        />
        <Text
          style={{
            marginHorizontal: 12,
            fontSize: 13,
            fontFamily: "PlusJakartaSans_500Medium",
            color: colors.slate,
          }}
        >
          or continue with
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: "rgba(94, 90, 128, 0.25)",
          }}
        />
      </View>

      {/* Google Button */}
      <Pressable
        onPress={handleGoogleLogin}
        disabled={loading}
        style={{
          width: "100%",
          backgroundColor: colors.cream,
          borderRadius: 9999,
          minHeight: 50,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 16,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.deepIndigo} />
        ) : (
          <>
            <Text style={{ fontSize: 18, marginRight: 10 }}>🌐</Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.deepIndigo,
              }}
            >
              Sign In with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
