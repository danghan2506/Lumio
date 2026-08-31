import { useEffect, useRef, useState } from "react";
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
import { getActiveLanguage } from "@/lib/api";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import type { LanguageId } from "@/types/learning";

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments() as readonly string[];

  const [isReady, setIsReady] = useState(false);
  const isHydratingRef = useRef(false);

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
    if ((loaded || error) && isReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isReady]);

  // Auth state listener: redirect based on session, hydrate from Supabase
  useEffect(() => {
    if (!loaded && !error) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const inAuthGroup = segments[0] === "(auth)";
        const hasSelectedLanguage = useLanguageStore.getState().hasSelectedLanguage;
        // Password recovery establishes a session on the reset screen via
        // setSession(); the user must stay there to enter a new password.
        const onResetPassword = segments[1] === "reset-password";

        if (session) {
          if (onResetPassword) {
            return;
          }
          if (!hasSelectedLanguage) {
            // Local store is empty — try to hydrate from Supabase
            if (isHydratingRef.current) return;
            isHydratingRef.current = true;

            getActiveLanguage()
              .then((activeLanguage) => {
                if (activeLanguage?.language_id) {
                  // User has a language in DB — hydrate stores and go to app
                  useLanguageStore.setState({
                    selectedLanguage: activeLanguage.language_id as LanguageId,
                    hasSelectedLanguage: true,
                  });
                  useOnboardingStore.setState({
                    hasSeenOnboarding: true,
                  });
                  router.replace("/(tabs)" as Href);
                } else {
                  // No language in DB — first-time setup
                  if (segments[1] !== "select-language") {
                    router.replace("/(auth)/select-language");
                  }
                }
              })
              .catch(() => {
                // DB fetch failed — fall through to language selection
                if (segments[1] !== "select-language") {
                  router.replace("/(auth)/select-language");
                }
              })
              .finally(() => {
                isHydratingRef.current = false;
                setIsReady(true);
              });
            return;
          }

          // Local store has language — go to app if still on auth screens
          if (inAuthGroup) {
            router.replace("/(tabs)" as Href);
          }
          setIsReady(true);
        } else {
          // Signed out — reset stores and go to login
          useLanguageStore.setState({
            selectedLanguage: null,
            hasSelectedLanguage: false,
          });
          useOnboardingStore.setState({
            hasSeenOnboarding: false,
          });
          if (!inAuthGroup) {
            router.replace("/(auth)/login");
          }
          setIsReady(true);
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
        <Stack.Screen
          name="vocabulary/review"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
