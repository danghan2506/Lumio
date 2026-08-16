import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { colors } from '@/theme/colors';

export const ProfileSkeletonLoader: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const skeletonCardStyle = {
    backgroundColor: '#31265E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(94, 90, 128, 0.25)',
  };

  return (
    <View
      testID="profile-skeleton-loader"
      accessibilityLabel="Loading profile information..."
      style={{ gap: 16 }}
    >
      {/* Skeleton 1: Profile Header Card */}
      <Animated.View
        testID="skeleton-header-card"
        style={[
          skeletonCardStyle,
          {
            height: 220,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pulseAnim,
          },
        ]}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: 'rgba(234, 230, 255, 0.15)',
            marginBottom: 16,
          }}
        />
        <View
          style={{
            width: 140,
            height: 20,
            borderRadius: 8,
            backgroundColor: 'rgba(234, 230, 255, 0.15)',
            marginBottom: 8,
          }}
        />
        <View
          style={{
            width: 180,
            height: 14,
            borderRadius: 6,
            backgroundColor: 'rgba(234, 230, 255, 0.1)',
            marginBottom: 12,
          }}
        />
        <View
          style={{
            width: 100,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(234, 230, 255, 0.1)',
          }}
        />
      </Animated.View>

      {/* Skeleton 2: Active Language Card */}
      <Animated.View
        testID="skeleton-active-language-card"
        style={[
          skeletonCardStyle,
          {
            height: 104,
            padding: 20,
            justifyContent: 'center',
            opacity: pulseAnim,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: 'rgba(234, 230, 255, 0.15)',
            }}
          />
          <View style={{ flex: 1, gap: 8 }}>
            <View
              style={{
                width: 120,
                height: 18,
                borderRadius: 6,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
              }}
            />
            <View
              style={{
                width: 90,
                height: 12,
                borderRadius: 4,
                backgroundColor: 'rgba(234, 230, 255, 0.1)',
              }}
            />
          </View>
          <View
            style={{
              width: 100,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(234, 230, 255, 0.1)',
            }}
          />
        </View>
      </Animated.View>

      {/* Skeleton 3: 2x2 Stats Grid */}
      <View testID="skeleton-stats-grid" style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Animated.View
            style={[
              skeletonCardStyle,
              { flex: 1, height: 112, padding: 16, opacity: pulseAnim },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 16,
              }}
            />
            <View
              style={{
                width: 60,
                height: 20,
                borderRadius: 6,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 4,
              }}
            />
            <View
              style={{
                width: 80,
                height: 10,
                borderRadius: 4,
                backgroundColor: 'rgba(234, 230, 255, 0.1)',
              }}
            />
          </Animated.View>
          <Animated.View
            style={[
              skeletonCardStyle,
              { flex: 1, height: 112, padding: 16, opacity: pulseAnim },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 16,
              }}
            />
            <View
              style={{
                width: 60,
                height: 20,
                borderRadius: 6,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 4,
              }}
            />
            <View
              style={{
                width: 80,
                height: 10,
                borderRadius: 4,
                backgroundColor: 'rgba(234, 230, 255, 0.1)',
              }}
            />
          </Animated.View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Animated.View
            style={[
              skeletonCardStyle,
              { flex: 1, height: 112, padding: 16, opacity: pulseAnim },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 16,
              }}
            />
            <View
              style={{
                width: 60,
                height: 20,
                borderRadius: 6,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 4,
              }}
            />
            <View
              style={{
                width: 80,
                height: 10,
                borderRadius: 4,
                backgroundColor: 'rgba(234, 230, 255, 0.1)',
              }}
            />
          </Animated.View>
          <Animated.View
            style={[
              skeletonCardStyle,
              { flex: 1, height: 112, padding: 16, opacity: pulseAnim },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 16,
              }}
            />
            <View
              style={{
                width: 60,
                height: 20,
                borderRadius: 6,
                backgroundColor: 'rgba(234, 230, 255, 0.15)',
                marginBottom: 4,
              }}
            />
            <View
              style={{
                width: 80,
                height: 10,
                borderRadius: 4,
                backgroundColor: 'rgba(234, 230, 255, 0.1)',
              }}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};
