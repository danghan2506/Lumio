import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabScreenWrapper } from "@/components/navigation/TabScreenWrapper";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <TabScreenWrapper>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 24,
              color: colors.cream,
              marginBottom: 8,
            }}
          >
            Profile
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 14,
              color: colors.lavenderMist,
              textAlign: "center",
            }}
          >
            Your account settings, progress stats, and achievement badges.
          </Text>
        </View>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
