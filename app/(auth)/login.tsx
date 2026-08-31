import { LoginForm } from "@/components/auth/LoginForm";
import { SocialAuthGroup } from "@/components/auth/SocialAuthGroup";
import { images } from "@/constants/images";
import { colors } from "@/theme/colors";
import { Href, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
          justifyContent: "center",
          alignItems: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mascot Header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image
            source={images.welcome}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              marginBottom: 12,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 26,
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.cream,
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Welcome back! 👋
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.lavenderMist,
              textAlign: "center",
            }}
          >
            Continue the learning journey with Lumi
          </Text>
        </View>

        {/* Form Card Container */}
        <View
          style={{
            width: "100%",
            backgroundColor: "rgba(234, 230, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(94, 90, 128, 0.2)",
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <LoginForm
            onSuccess={() => {}}
            onForgotPassword={() =>
              router.push("/(auth)/forgot-password" as Href)
            }
          />
          <SocialAuthGroup />
        </View>

        {/* Footer Link */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.slate,
            }}
          >
            First time user?{" "}
          </Text>
          <Pressable onPress={() => router.push("/(auth)/register" as Href)}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.lumioCoral,
              }}
            >
              Sign up now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
