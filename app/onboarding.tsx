import { images } from "@/constants/images";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SlideData {
  id: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: SlideData[] = [
  {
    id: "1",
    badge: "AI VOICE TUTOR",
    badgeBg: "rgba(255, 107, 87, 0.15)",
    badgeColor: colors.lumioCoral,
    title: "Học giao tiếp cùng Lumi",
    subtitle:
      "Luyện phản xạ nói tiếng Anh/Tây Ban Nha tự nhiên 24/7 với Trợ lý AI thông minh.",
  },
  {
    id: "2",
    badge: "SPACED REPETITION",
    badgeBg: "rgba(53, 208, 160, 0.15)",
    badgeColor: colors.mint,
    title: "Học từ vựng thông minh",
    subtitle:
      "Ghi nhớ từ vựng lâu hơn gấp 5 lần nhờ phương pháp lặp lại ngắt quãng khoa học.",
  },
  {
    id: "3",
    badge: "STREAKS & REWARDS",
    badgeBg: "rgba(255, 183, 77, 0.15)",
    badgeColor: colors.daylightAmber,
    title: "Duy trì thói quen & Streak",
    subtitle:
      "Tích lũy điểm thưởng, giữ vững thói quen và cảm nhận sự tiến bộ mỗi ngày.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const finishOnboarding = useOnboardingStore(
    (state) => state.finishOnboarding,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleGetStarted = () => {
    finishOnboarding();
    router.replace("/(auth)/login");
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    if (slideSize > 0) {
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
        setActiveIndex(index);
      }
    }
  };

  const renderSlideGraphic = (slideId: string) => {
    switch (slideId) {
      case "1":
        // Slide 1: Lumi Mascot & Organic Floating Speech Bubbles (EN, ES, FR, JP)
        return (
          <View
            style={{
              width: 340,
              height: 260,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Lumi Mascot Image */}
            <View
              style={{
                width: 130,
                height: 130,
                borderRadius: 65,
                overflow: "hidden",
                borderWidth: 3,
                borderColor: colors.lumioCoral,
                shadowColor: colors.lumioCoral,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Image
                source={images.mascot}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>

            {/* Bubble 1 (English) - Top Left, -6 deg tilt */}
            <View
              style={{
                position: "absolute",
                top: 5,
                left: 2,
                transform: [{ rotate: "-6deg" }],
                backgroundColor: "#FFFBF4",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 16,
                borderBottomRightRadius: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 13 }}>🇬🇧</Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 13,
                  color: colors.deepIndigo,
                }}
              >
                Hello! Ready?
              </Text>
            </View>

            {/* Bubble 2 (Spanish) - Top Right Staggered, +5 deg tilt */}
            <View
              style={{
                position: "absolute",
                top: 22,
                right: 0,
                transform: [{ rotate: "5deg" }],
                backgroundColor: colors.lumioCoral,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                shadowColor: colors.lumioCoral,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 13 }}>🇪🇸</Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 13,
                  color: colors.cream,
                }}
              >
                ¡Hola! ¿Qué tal?
              </Text>
            </View>

            {/* Bubble 3 (French) - Bottom Left Staggered, -4 deg tilt */}
            <View
              style={{
                position: "absolute",
                bottom: 15,
                left: 0,
                transform: [{ rotate: "-4deg" }],
                backgroundColor: "#31265E",
                borderWidth: 1.5,
                borderColor: colors.daylightAmber,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 18,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 13 }}>🇫🇷</Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 13,
                  color: colors.daylightAmber,
                }}
              >
                Bonjour! Enchanté ✨
              </Text>
            </View>

            {/* Bubble 4 (Japanese) - Bottom Right Staggered, +7 deg tilt */}
            <View
              style={{
                position: "absolute",
                bottom: 5,
                right: 8,
                transform: [{ rotate: "7deg" }],
                backgroundColor: "rgba(53, 208, 160, 0.15)",
                borderWidth: 1,
                borderColor: colors.mint,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 16,
                shadowColor: colors.mint,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 13 }}>🇯🇵</Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 13,
                  color: colors.mint,
                }}
              >
                こんにちは!
              </Text>
            </View>
          </View>
        );

      case "2":
        // Slide 2: Spaced Repetition Vocabulary Cards
        return (
          <View
            style={{
              width: 280,
              height: 240,
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Top Main Vocabulary Card */}
            <View
              style={{
                width: "100%",
                backgroundColor: "#31265E",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1.5,
                borderColor: colors.mint,
                shadowColor: colors.mint,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Fredoka_700Bold",
                    fontSize: 20,
                    color: colors.cream,
                  }}
                >
                  El libro
                </Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.mint,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 12,
                      color: colors.deepIndigo,
                    }}
                  >
                    ✓
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 14,
                  color: colors.lavenderMist,
                }}
              >
                &quot;The book&quot; — Noun (masculine)
              </Text>

              {/* Progress retention bar */}
              <View style={{ gap: 4, marginTop: 4 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 11,
                      color: colors.mint,
                    }}
                  >
                    98% Memory Retention
                  </Text>
                  <Text
                    style={{
                      fontFamily: "JetBrainsMono_500Medium",
                      fontSize: 11,
                      color: colors.slate,
                    }}
                  >
                    Review in 7d
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    width: "100%",
                    backgroundColor: "rgba(234, 230, 255, 0.1)",
                    borderRadius: 3,
                  }}
                >
                  <View
                    style={{
                      height: 6,
                      width: "98%",
                      backgroundColor: colors.mint,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Stacked Sub Card */}
            <View
              style={{
                width: "92%",
                backgroundColor: "rgba(49, 38, 94, 0.6)",
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: "rgba(234, 230, 255, 0.15)",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 15,
                  color: colors.lavenderMist,
                }}
              >
                La manzana
              </Text>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_500Medium",
                  fontSize: 12,
                  color: colors.daylightAmber,
                }}
              >
                Next: 3d
              </Text>
            </View>
          </View>
        );

      case "3":
        // Slide 3: Gamified Streak & XP Rewards
        return (
          <View
            style={{
              width: 280,
              height: 240,
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Streak Card */}
            <View
              style={{
                width: "100%",
                backgroundColor: "#31265E",
                borderRadius: 24,
                padding: 20,
                alignItems: "center",
                gap: 12,
                borderWidth: 1.5,
                borderColor: colors.daylightAmber,
                shadowColor: colors.daylightAmber,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {/* Flame Badge */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 36 }}>⚡</Text>
                <View>
                  <Text
                    style={{
                      fontFamily: "Fredoka_700Bold",
                      fontSize: 24,
                      color: colors.daylightAmber,
                    }}
                  >
                    7 DAY STREAK
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 13,
                      color: colors.lavenderMist,
                    }}
                  >
                    You&apos;re on a roll! Keep it up!
                  </Text>
                </View>
              </View>

              {/* XP Pill */}
              <View
                style={{
                  backgroundColor: "rgba(255, 183, 77, 0.15)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: colors.daylightAmber,
                }}
              >
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_500Medium",
                    fontSize: 15,
                    color: colors.daylightAmber,
                  }}
                >
                  +250 XP EARNED TODAY
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View
        style={{
          height: 48,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable onPress={handleGetStarted} hitSlop={12}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                color: colors.slate,
              }}
            >
              Bỏ qua
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Carousel Body */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            style={{
              width: SCREEN_WIDTH,
              paddingHorizontal: 28,
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* Visual Graphic Component */}
            {renderSlideGraphic(item.id)}

            {/* Category Badge */}
            <View
              style={{
                backgroundColor: item.badgeBg,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 11,
                  color: item.badgeColor,
                  letterSpacing: 1.2,
                }}
              >
                {item.badge}
              </Text>
            </View>

            {/* Content Text */}
            <View style={{ gap: 10, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 26,
                  lineHeight: 32,
                  color: colors.cream,
                  textAlign: "center",
                  letterSpacing: 0.5,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 15,
                  lineHeight: 22,
                  color: colors.lavenderMist,
                  textAlign: "center",
                  paddingHorizontal: 12,
                }}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Pagination & Bottom Action Bar */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}>
        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          {SLIDES.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={{
                  height: 8,
                  width: isActive ? 24 : 8,
                  borderRadius: 4,
                  backgroundColor: isActive
                    ? index === 2
                      ? colors.daylightAmber
                      : colors.lumioCoral
                    : "rgba(234, 230, 255, 0.25)",
                }}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable
            onPress={handleNext}
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
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 16,
                color: colors.cream,
              }}
            >
              Tiếp theo
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={handleGetStarted}
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
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 16,
                  color: colors.cream,
                }}
              >
                Bắt đầu ngay
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
