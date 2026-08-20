import React, { useEffect, useState } from "react";
import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";
import { TabBarIcon } from "./TabBarIcon";
import { Ionicons } from "@expo/vector-icons";

interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: "index",
    label: "Home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  learn: {
    name: "learn",
    label: "Learn",
    activeIcon: "book",
    inactiveIcon: "book-outline",
  },
  vocabulary: {
    name: "vocabulary",
    label: "Vocab",
    activeIcon: "layers",
    inactiveIcon: "layers-outline",
  },
  profile: {
    name: "profile",
    label: "Profile",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = state.index;
  const totalTabs = state.routes.length;
  const tabWidth = containerWidth > 0 ? containerWidth / totalTabs : 0;

  const pillTranslateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      pillTranslateX.value = withSpring(activeIndex * tabWidth, {
        damping: 16,
        stiffness: 140,
      });
    }
  }, [activeIndex, tabWidth, pillTranslateX]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslateX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={{
        backgroundColor: colors.deepIndigo,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 8,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(234, 230, 255, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        onLayout={handleLayout}
        style={{
          flexDirection: "row",
          height: 56,
          position: "relative",
          alignItems: "center",
        }}
      >
        {/* Animated Sliding Active Indicator Pill */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              {
                position: "absolute",
                width: tabWidth - 8,
                height: 48,
                left: 4,
                borderRadius: 24,
                backgroundColor: "rgba(234, 230, 255, 0.12)",
                borderWidth: 1,
                borderColor: "rgba(255, 107, 87, 0.3)",
              },
              pillAnimatedStyle,
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name] || {
            name: route.name,
            label: options.title || route.name,
            activeIcon: "ellipse",
            inactiveIcon: "ellipse-outline",
          };

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (route.params !== undefined) {
                navigation.navigate(route.name, route.params);
              } else {
                navigation.navigate(route.name);
              }
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const iconName = isFocused ? config.activeIcon : config.inactiveIcon;
          const iconColor = isFocused ? colors.lumioCoral : colors.slate;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID || `tab-${route.name}`}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                height: 48,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 24,
                gap: 2,
              }}
            >
              <TabBarIcon
                name={iconName}
                color={iconColor}
                focused={isFocused}
                size={22}
              />
              <Text
                style={{
                  fontFamily: isFocused
                    ? "PlusJakartaSans_700Bold"
                    : "PlusJakartaSans_500Medium",
                  fontSize: 10,
                  lineHeight: 12,
                  color: isFocused ? colors.cream : colors.slate,
                }}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
