import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface AudioControlsProps {
  isMuted: boolean;
  showCaptions: boolean;
  isCallJoined?: boolean;
  onToggleMute: () => void;
  onToggleCaptions: () => void;
}

export function AudioControls({
  isMuted,
  showCaptions,
  isCallJoined = true,
  onToggleMute,
  onToggleCaptions,
}: AudioControlsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
      }}
    >
      {/* Captions Toggle Button (48px) */}
      <TouchableOpacity
        testID="captions-toggle"
        onPress={onToggleCaptions}
        activeOpacity={0.7}
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: showCaptions ? colors.lavenderMist : 'rgba(94,90,128,0.15)',
            borderWidth: 1,
            borderColor: showCaptions ? 'transparent' : 'rgba(94,90,128,0.3)',
          },
        ]}
      >
        <Ionicons
          name={showCaptions ? 'chatbox-ellipses' : 'chatbox-ellipses-outline'}
          size={22}
          color={showCaptions ? colors.deepIndigo : colors.lavenderMist}
        />
      </TouchableOpacity>

      {/* Central Mic Button (64px) */}
      <TouchableOpacity
        testID="mic-toggle"
        onPress={onToggleMute}
        disabled={!isCallJoined}
        activeOpacity={0.8}
        style={[
          {
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isMuted ? colors.deepIndigo : colors.lumioCoral,
            borderWidth: isMuted ? 2 : 0,
            borderColor: isMuted ? colors.lumioCoral : 'transparent',
            opacity: isCallJoined ? 1 : 0.5,
          },
        ]}
      >
        <Ionicons
          name={isMuted ? 'mic-off' : 'mic'}
          size={28}
          color={isMuted ? colors.lumioCoral : colors.cream}
        />
      </TouchableOpacity>

      {/* Right Decorative Speaker / Audio Indicator (48px) */}
      <View
        testID="audio-indicator"
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(94,90,128,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(94,90,128,0.3)',
          },
        ]}
      >
        <Ionicons
          name="volume-high-outline"
          size={22}
          color={colors.lavenderMist}
        />
      </View>
    </View>
  );
}
