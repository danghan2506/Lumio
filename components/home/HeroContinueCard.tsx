import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface HeroContinueCardProps {
  language: string;
  level: string;
  unitTitle: string;
  onContinue?: () => void;
}

export const HeroContinueCard: React.FC<HeroContinueCardProps> = ({
  language,
  level,
  unitTitle,
  onContinue,
}) => {
  const courseTitle = `${language} ${level} • ${unitTitle}`;

  return (
    <View className="mx-6 my-3 bg-[#241B4A] rounded-3xl shadow-md overflow-hidden relative p-6 border border-[#5E5A80]/30">
      {/* Decorative Right Accent Block */}
      <View className="absolute right-0 top-0 bottom-0 w-32 bg-[#4B3FA8]/40 items-center justify-center pointer-events-none">
        <FontAwesome5 name="landmark" size={48} color="rgba(255, 255, 255, 0.15)" />
      </View>

      {/* Card Content */}
      <View className="flex-1 pr-24 z-10">
        <Text
          style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
          className="text-[#FF6B57] text-xs uppercase tracking-wider mb-1"
        >
          CONTINUE LEARNING
        </Text>

        <Text
          style={{ fontFamily: 'Fredoka_700Bold' }}
          className="text-[#FFFBF4] text-xl mb-5 leading-tight"
        >
          {courseTitle}
        </Text>

        {/* Primary CTA Button (Lumio Coral #FF6B57 fill with Cream #FFFBF4 text per DESIGN.md) */}
        <Pressable
          onPress={onContinue}
          className="bg-[#FF6B57] px-6 py-3 rounded-full self-start shadow-sm active:bg-[#FF533D]"
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ translateY: pressed ? 1 : 0 }],
          })}
        >
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-[#FFFBF4] text-sm"
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

