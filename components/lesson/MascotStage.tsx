import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';

export interface MascotStageProps {
  callStatus: 'connecting' | 'joining' | 'joined' | 'error';
  teacherStatus: 'idle' | 'connecting' | 'connected' | 'failed';
  isMuted: boolean;
  onRetryTeacher?: () => void;
}

export function MascotStage({
  callStatus,
  teacherStatus,
  isMuted,
  onRetryTeacher,
}: MascotStageProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  const isLive = callStatus === 'joined' && teacherStatus === 'connected' && !isMuted;

  useEffect(() => {
    if (isLive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1200 }),
          withTiming(0.2, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1.0, { duration: 300 });
      pulseOpacity.value = withTiming(0.2, { duration: 300 });
    }
  }, [isLive, pulseScale, pulseOpacity]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const renderStatusPill = () => {
    if (callStatus === 'error') {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,107,87,0.15)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Ionicons
            name="alert-circle"
            size={14}
            color={colors.lumioCoral}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.lumioCoral,
              fontSize: 12,
            }}
          >
            Connection error
          </Text>
        </View>
      );
    }

    if (
      callStatus === 'connecting' ||
      callStatus === 'joining' ||
      teacherStatus === 'connecting'
    ) {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,183,77,0.15)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <ActivityIndicator
            size="small"
            color={colors.daylightAmber}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.daylightAmber,
              fontSize: 12,
            }}
          >
            Connecting to Lumi…
          </Text>
        </View>
      );
    }

    if (teacherStatus === 'failed') {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,107,87,0.15)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={colors.lumioCoral}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.lumioCoral,
              fontSize: 12,
              marginRight: 8,
            }}
          >
            Teacher unavailable
          </Text>
          {onRetryTeacher && (
            <TouchableOpacity onPress={onRetryTeacher}>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.cream,
                  fontSize: 12,
                  textDecorationLine: 'underline',
                }}
              >
                Retry teacher
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (isMuted) {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(94,90,128,0.2)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Ionicons
            name="mic-off"
            size={13}
            color={colors.slate}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.lavenderMist,
              fontSize: 12,
            }}
          >
            Microphone muted
          </Text>
        </View>
      );
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(53,208,160,0.15)',
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.mint,
            marginRight: 6,
          }}
        />
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.mint,
            fontSize: 12,
          }}
        >
          Lumi is listening
        </Text>
      </View>
    );
  };

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <View
        style={{
          width: 190,
          height: 190,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Animated outer aura */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: isLive ? colors.lumioCoral : 'transparent',
            },
            animatedGlowStyle,
          ]}
        />

        {/* Mascot Avatar Frame */}
        <View
          style={{
            width: 156,
            height: 156,
            borderRadius: 78,
            borderWidth: 3,
            borderColor: isLive ? colors.lumioCoral : 'rgba(94,90,128,0.3)',
            overflow: 'hidden',
            backgroundColor: '#1E1B3C',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={images.lumiTutor}
            style={{ width: 148, height: 148 }}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Live Status Pill */}
      <View style={{ marginTop: 16 }}>{renderStatusPill()}</View>
    </View>
  );
}
