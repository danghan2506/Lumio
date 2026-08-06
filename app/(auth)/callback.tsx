import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * OAuth callback screen.
 * Expo Router will render this when the deep link lumio://auth/callback
 * is triggered after a successful OAuth flow.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;

      try {
        const parsed = new URL(url);
        const params = new URLSearchParams(parsed.hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            router.replace("/");
            return;
          }
        }
      } catch {
        // URL might not have hash params (already handled by WebBrowser flow)
      }

      // Fallback: navigate to login if we can't extract tokens
      router.replace("/(auth)/login");
    };

    handleCallback();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.deepIndigo,
      }}
    >
      <ActivityIndicator size="large" color={colors.lumioCoral} />
    </View>
  );
}
