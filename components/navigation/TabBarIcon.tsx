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
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
