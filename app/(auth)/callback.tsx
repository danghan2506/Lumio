import { supabase } from "@/lib/supabase";
import { parseAuthTokens } from "@/lib/authCallback";
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
        const tokens = parseAuthTokens(url);
        if (tokens) {
          const { error } = await supabase.auth.setSession(tokens);

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
