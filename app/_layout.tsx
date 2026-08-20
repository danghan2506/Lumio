import { useEffect } from "react";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useLanguageStore } from "@/store/useLanguageStore";
import type { Session } from "@supabase/supabase-js";

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments() as readonly string[];

  const [loaded, error] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Auth state listener: redirect based on session
  useEffect(() => {
    if (!loaded && !error) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const inAuthGroup = segments[0] === "(auth)";
        const hasSelectedLanguage = useLanguageStore.getState().hasSelectedLanguage;

        if (session) {
          if (!hasSelectedLanguage) {
            // First time: go to language selection (if not already there)
            if (segments[1] !== "select-language") {
              router.replace("/(auth)/select-language");
            }
          } else if (inAuthGroup) {
            // Returning user still on auth screen: go to app
            router.replace("/(tabs)" as Href);
          }
        } else if (!session && !inAuthGroup) {
          // Not logged in and not on auth screen → go to login
          router.replace("/(auth)/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loaded, error, segments, router]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="lesson/[id]"
          options={{ presentation: 'fullScreenModal', gestureEnabled: true }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
