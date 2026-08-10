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
  }, [opacity, scale]);

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
