import React, { useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Pressable,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import { useOnboardingStore } from "@/store/useOnboardingStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SlideData {
  id: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  iconSymbol: string;
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
    iconSymbol: "🔥",
  },
  {
    id: "2",
    badge: "SPACED REPETITION",
    badgeBg: "rgba(53, 208, 160, 0.15)",
    badgeColor: colors.mint,
    title: "Học từ vựng thông minh",
    subtitle:
      "Ghi nhớ từ vựng lâu hơn gấp 5 lần nhờ phương pháp lặp lại ngắt quãng khoa học.",
    iconSymbol: "🧠",
  },
  {
    id: "3",
    badge: "STREAKS & REWARDS",
    badgeBg: "rgba(255, 183, 77, 0.15)",
    badgeColor: colors.daylightAmber,
    title: "Duy trì thói quen & Streak",
    subtitle:
      "Tích lũy điểm thưởng, giữ vững thói quen và cảm nhận sự tiến bộ mỗi ngày.",
    iconSymbol: "⚡",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const finishOnboarding = useOnboardingStore((state) => state.finishOnboarding);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleComplete = () => {
    finishOnboarding();
    router.replace("/");
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      handleComplete();
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
          <Pressable onPress={handleComplete} hitSlop={12}>
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
              paddingHorizontal: 32,
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
            }}
          >
            {/* Visual Card Artwork Container */}
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: "rgba(234, 230, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(234, 230, 255, 0.12)",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: colors.lumioCoral,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
              }}
            >
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: colors.lavenderMist,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 64 }}>{item.iconSymbol}</Text>
              </View>
            </View>

            {/* Badge */}
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
            <View style={{ gap: 12, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 28,
                  lineHeight: 34,
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
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.lavenderMist,
                  textAlign: "center",
                }}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Pagination & Bottom Action Bar */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 24 }}>
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
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleComplete}
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
            <Pressable
              onPress={handleComplete}
              style={{
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: colors.slate,
                borderRadius: 9999,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 15,
                  color: colors.cream,
                }}
              >
                Đã có tài khoản? Đăng nhập
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
