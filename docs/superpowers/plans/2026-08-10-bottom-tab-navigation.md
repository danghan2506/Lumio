# Lumio Bottom Tab Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Lumio custom animated bottom tab bar navigation containing Home, Learn, AI Teacher, Chat, and Profile tabs with smooth tab switching transitions and spring icon animations using React Native Reanimated and Expo Router.

**Architecture:** A custom `TabBar` component replaces the default Expo Router tab bar, using Reanimated spring layout animations for active pill movement and scale interactions, and wrapping individual screens in `TabScreenWrapper` for smooth screen opacity cross-fades.

**Tech Stack:** Expo Router, React Native Reanimated, `@expo/vector-icons` (Ionicons), Expo Haptics, NativeWind, React Native Safe Area Context.

## Global Constraints

- NativeWind v5 for styling utility tokens (`colors.deepIndigo`, `colors.lumioCoral`, `colors.slate`, `colors.cream`, etc.)
- Inline styles required for `SafeAreaView` / `SafeAreaProvider` containers per `AGENTS.md`.
- Mobile-first, strict TypeScript, no `any`.
- Home screen UI must remain a minimal placeholder shell for now (per prompt directive).

---

### Task 1: Tab Micro-Animation Components (`TabScreenWrapper` & `TabBarIcon`)

**Files:**
- Create: `components/navigation/TabScreenWrapper.tsx`
- Create: `components/navigation/TabBarIcon.tsx`

**Interfaces:**
- `TabScreenWrapper`: `{ children: React.ReactNode; style?: ViewStyle }`
- `TabBarIcon`: `{ name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean; size?: number }`

- [ ] **Step 1: Create TabScreenWrapper component**

Create `components/navigation/TabScreenWrapper.tsx` with Reanimated opacity cross-fade and scale-in animation when focused.

```tsx
import React, { useEffect } from "react";
import { ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

interface TabScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TabScreenWrapper({ children, style }: TabScreenWrapperProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.97);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
    scale.value = withSpring(1, { damping: 18, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
```

- [ ] **Step 2: Create TabBarIcon component**

Create `components/navigation/TabBarIcon.tsx` with Ionicons icon and spring bounce scale animation on active focus state.

```tsx
import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  size?: number;
}

export function TabBarIcon({ name, color, focused, size = 22 }: TabBarIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, { damping: 12, stiffness: 160 });
    } else {
      scale.value = withSpring(1.0, { damping: 14, stiffness: 140 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
```

- [ ] **Step 3: Run typecheck to verify Task 1 interfaces**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 1**

```bash
git add components/navigation/TabScreenWrapper.tsx components/navigation/TabBarIcon.tsx
git commit -m "feat(navigation): add TabScreenWrapper and TabBarIcon components"
```

---

### Task 2: Custom Animated TabBar Component (`TabBar.tsx`)

**Files:**
- Create: `components/navigation/TabBar.tsx`

**Interfaces:**
- Consumes: `BottomTabBarProps` from `@react-navigation/bottom-tabs`.
- Renders: Custom tab bar layout with animated sliding active pill indicator, icon labels, safe area inset padding, and `expo-haptics`.

- [ ] **Step 1: Create TabBar component**

Create `components/navigation/TabBar.tsx` with Reanimated active indicator pill sliding animation:

```tsx
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
  "ai-teacher": {
    name: "ai-teacher",
    label: "AI Teacher",
    activeIcon: "sparkles",
    inactiveIcon: "sparkles-outline",
  },
  chat: {
    name: "chat",
    label: "Chat",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubbles-outline",
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
  }, [activeIndex, tabWidth]);

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
              navigation.navigate(route.name, route.params);
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
              testID={options.tabBarButtonTestID}
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
```

- [ ] **Step 2: Run typecheck to verify TabBar**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit Task 2**

```bash
git add components/navigation/TabBar.tsx
git commit -m "feat(navigation): create custom animated TabBar component"
```

---

### Task 3: Tab Screens & Layout Routing (`app/(tabs)/`)

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/learn.tsx`
- Create: `app/(tabs)/ai-teacher.tsx`
- Create: `app/(tabs)/chat.tsx`
- Create: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Create `app/(tabs)/_layout.tsx`**

```tsx
import React from "react";
import { Tabs } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
      <Tabs.Screen name="ai-teacher" options={{ title: "AI Teacher" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create `app/(tabs)/index.tsx` (Home Placeholder)**

Create a clean placeholder shell for Home (strictly keeping UI minimal per request):

```tsx
import React from "react";
import { View, Text, SafeAreaView, StatusBar } from "react-native";
import { colors } from "@/theme/colors";
import { TabScreenWrapper } from "@/components/navigation/TabScreenWrapper";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <TabScreenWrapper
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 28,
            color: colors.cream,
            marginBottom: 8,
          }}
        >
          Home
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 15,
            color: colors.lavenderMist,
            textAlign: "center",
          }}
        >
          Welcome to Lumio. Dashboard coming soon.
        </Text>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Create `app/(tabs)/learn.tsx` (Learn Placeholder)**

```tsx
import React from "react";
import { View, Text, SafeAreaView, StatusBar } from "react-native";
import { colors } from "@/theme/colors";
import { TabScreenWrapper } from "@/components/navigation/TabScreenWrapper";

export default function LearnScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <TabScreenWrapper
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 28,
            color: colors.cream,
            marginBottom: 8,
          }}
        >
          Learn
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 15,
            color: colors.lavenderMist,
            textAlign: "center",
          }}
        >
          Interactive skill tree & lessons path.
        </Text>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Create `app/(tabs)/ai-teacher.tsx` (AI Teacher Placeholder)**

```tsx
import React from "react";
import { View, Text, SafeAreaView, StatusBar } from "react-native";
import { colors } from "@/theme/colors";
import { TabScreenWrapper } from "@/components/navigation/TabScreenWrapper";

export default function AITeacherScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <TabScreenWrapper
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 28,
            color: colors.cream,
            marginBottom: 8,
          }}
        >
          AI Teacher
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 15,
            color: colors.lavenderMist,
            textAlign: "center",
          }}
        >
          Real-time interactive AI video tutoring session.
        </Text>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Create `app/(tabs)/chat.tsx` (Chat Placeholder)**

```tsx
import React from "react";
import { View, Text, SafeAreaView, StatusBar } from "react-native";
import { colors } from "@/theme/colors";
import { TabScreenWrapper } from "@/components/navigation/TabScreenWrapper";

export default function ChatScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <TabScreenWrapper
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 28,
            color: colors.cream,
            marginBottom: 8,
          }}
        >
          Chat Tutor
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 15,
            color: colors.lavenderMist,
            textAlign: "center",
          }}
        >
          Conversational practice with your AI partner.
        </Text>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
```

- [ ] **Step 6: Create `app/(tabs)/profile.tsx` (Profile Placeholder)**

```tsx
import React from "react";
import { View, Text, SafeAreaView, StatusBar } from "react-native";
import { colors } from "@/theme/colors";
import { TabScreenWrapper } from "@/components/navigation/TabScreenWrapper";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <TabScreenWrapper
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 28,
            color: colors.cream,
            marginBottom: 8,
          }}
        >
          Profile
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 15,
            color: colors.lavenderMist,
            textAlign: "center",
          }}
        >
          User profile, XP, streak history & settings.
        </Text>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
```

- [ ] **Step 7: Run typecheck to verify all tab screens**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 8: Commit Task 3**

```bash
git add app/\(tabs\)
git commit -m "feat(navigation): add app/(tabs) layout and 5 tab placeholder screens"
```

---

### Task 4: Root Routing Integration & End-to-End Verification

**Files:**
- Modify: `app/_layout.tsx:80-89`
- Modify: `app/index.tsx`

- [ ] **Step 1: Update `app/_layout.tsx` to include `(tabs)` stack screen**

In `app/_layout.tsx`:
Add `<Stack.Screen name="(tabs)" />` to the `Stack` navigator.

- [ ] **Step 2: Update `app/index.tsx` to redirect to `/(tabs)`**

Update `app/index.tsx` so that when `hasSeenOnboarding` is true, it renders `<Redirect href="/(tabs)" />` (or `<Redirect href="/(tabs)/" />`).

- [ ] **Step 3: Run typecheck and lint verification**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

Run: `npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 4**

```bash
git add app/_layout.tsx app/index.tsx
git commit -m "feat(navigation): connect (tabs) route to root navigator layout"
```
