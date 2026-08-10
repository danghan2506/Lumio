import React from "react";
import { Redirect, type Href } from "expo-router";
import { useOnboardingStore } from "@/store/useOnboardingStore";

export default function Index() {
  const hasSeenOnboarding = useOnboardingStore(
    (state) => state.hasSeenOnboarding
  );

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={"/(tabs)" as Href} />;
}
