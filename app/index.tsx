import React, { useState } from "react";
import { Redirect } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { colors } from "@/theme/colors";
import { useOnboardingStore } from "@/store/useOnboardingStore";

export default function DesignSystemShowcase() {
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(1);

  if (!hasSeenOnboarding) {
    return <Redirect href={"/onboarding" as any} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          gap: 28,
        }}
      >
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 32,
              lineHeight: 38,
              color: colors.cream,
              letterSpacing: 0.64,
            }}
          >
            Lumio Design System
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 16,
              lineHeight: 24,
              color: colors.lavenderMist,
            }}
          >
            Light up a new language. Core tokens, typography, buttons & cards.
          </Text>
        </View>

        {/* 1. Color Palette */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            1. Color Palette & Roles
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              { name: "Deep Indigo", hex: colors.deepIndigo, role: "Canvas / Surface" },
              { name: "Lumio Coral", hex: colors.lumioCoral, role: "Primary CTA" },
              { name: "Daylight Amber", hex: colors.daylightAmber, role: "XP / Streaks" },
              { name: "Mint", hex: colors.mint, role: "Success / Completion" },
              { name: "Lavender Mist", hex: colors.lavenderMist, role: "Soft Light Surface" },
              { name: "Cream", hex: colors.cream, role: "Light Canvas / Text" },
              { name: "Slate", hex: colors.slate, role: "Muted Text & Border" },
            ].map((c) => (
              <View
                key={c.name}
                style={{
                  width: "47%",
                  backgroundColor: "#31265E",
                  borderRadius: 16,
                  padding: 12,
                  gap: 6,
                  borderWidth: 1,
                  borderColor: "rgba(234, 230, 255, 0.1)",
                }}
              >
                <View
                  style={{
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: c.hex,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 14,
                    color: colors.cream,
                  }}
                >
                  {c.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_500Medium",
                    fontSize: 12,
                    color: colors.lavenderMist,
                  }}
                >
                  {c.hex}
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 11,
                    color: colors.slate,
                  }}
                >
                  {c.role}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Typography Scale */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            2. Typography Architecture
          </Text>
          <View
            style={{
              backgroundColor: "#31265E",
              borderRadius: 20,
              padding: 16,
              gap: 16,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                DISPLAY LARGE (32px Fredoka Bold)
              </Text>
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 32,
                  lineHeight: 38,
                  color: colors.cream,
                  letterSpacing: 0.64,
                }}
              >
                Hola, Lumi!
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                TITLE (24px Fredoka Bold)
              </Text>
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 24,
                  lineHeight: 30,
                  color: colors.cream,
                  letterSpacing: 0.48,
                }}
              >
                Daily Goal Completed
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                BODY LARGE (18px Plus Jakarta Medium)
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 18,
                  lineHeight: 26,
                  color: colors.lavenderMist,
                }}
              >
                Choose the correct translation for &quot;the book&quot;.
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                BODY REGULAR (16px Plus Jakarta Regular)
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.cream,
                }}
              >
                Understanding ignites speech. Every word learned is a small spark.
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                TABULAR NUMERALS (JetBrains Mono 500)
              </Text>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_500Medium",
                  fontSize: 20,
                  color: colors.daylightAmber,
                }}
              >
                +250 XP  |  7 DAY STREAK
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Button Styles */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            3. Buttons & Touch Targets (Min 48px)
          </Text>

          {/* Primary Button */}
          <Pressable
            onPressIn={() => setPressedBtn("primary")}
            onPressOut={() => setPressedBtn(null)}
            style={{
              backgroundColor: colors.lumioCoral,
              borderRadius: 9999,
              minHeight: 48,
              paddingHorizontal: 24,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ translateY: pressedBtn === "primary" ? 2 : 0 }],
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 16,
                color: colors.cream,
              }}
            >
              Primary CTA — Start Lesson
            </Text>
          </Pressable>

          {/* Secondary Button */}
          <Pressable
            onPressIn={() => setPressedBtn("secondary")}
            onPressOut={() => setPressedBtn(null)}
            style={{
              backgroundColor: "transparent",
              borderWidth: 1.5,
              borderColor: colors.slate,
              borderRadius: 9999,
              minHeight: 48,
              paddingHorizontal: 24,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ translateY: pressedBtn === "secondary" ? 2 : 0 }],
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 16,
                color: colors.cream,
              }}
            >
              Secondary — Review Vocabulary
            </Text>
          </Pressable>
        </View>

        {/* 4. Cards & Choice Options */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            4. Cards & Lesson Options
          </Text>
          {[
            { id: 1, text: "El libro", hint: "Correct answer" },
            { id: 2, text: "La manzana", hint: "Incorrect answer" },
          ].map((item) => {
            const isSelected = selectedOption === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedOption(item.id)}
                style={{
                  backgroundColor: isSelected ? colors.lavenderMist : "#31265E",
                  borderRadius: 24,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.mint : colors.slate,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: 64,
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 18,
                      color: isSelected ? colors.deepIndigo : colors.cream,
                    }}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 13,
                      color: isSelected ? colors.slate : colors.lavenderMist,
                    }}
                  >
                    {item.hint}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.mint,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 16,
                        color: colors.cream,
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
