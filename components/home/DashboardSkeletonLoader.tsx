import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const DashboardSkeletonLoader: React.FC = () => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View testID="dashboard-skeleton-loader" className="px-6 py-4 space-y-4">
      {/* Header Placeholder */}
      <View className="flex-row items-center justify-between py-2">
        <Animated.View
          style={animatedStyle}
          className="h-8 w-44 rounded-full bg-lavender-mist"
        />
        <Animated.View
          style={animatedStyle}
          className="h-9 w-20 rounded-full bg-lavender-mist"
        />
      </View>

      {/* Daily Goal Placeholder */}
      <Animated.View
        style={animatedStyle}
        className="h-28 w-full rounded-3xl bg-lavender-mist my-2"
      />

      {/* Hero Continue Placeholder */}
      <Animated.View
        style={animatedStyle}
        className="h-36 w-full rounded-3xl bg-lavender-mist my-2"
      />

      {/* Today's Plan Items Placeholders */}
      <View className="space-y-3 mt-4">
        <Animated.View
          style={animatedStyle}
          className="h-6 w-32 rounded-lg bg-lavender-mist mb-2"
        />
        <Animated.View
          style={animatedStyle}
          className="h-20 w-full rounded-2xl bg-lavender-mist mb-3"
        />
        <Animated.View
          style={animatedStyle}
          className="h-20 w-full rounded-2xl bg-lavender-mist mb-3"
        />
        <Animated.View
          style={animatedStyle}
          className="h-20 w-full rounded-2xl bg-lavender-mist"
        />
      </View>
    </View>
  );
};
