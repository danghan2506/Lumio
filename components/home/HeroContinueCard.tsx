import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

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
    <View className="mx-6 my-3 bg-[#241B4A] rounded-3xl shadow-md overflow-hidden relative p-6">
      {/* Decorative Right Accent Block */}
      <View className="absolute right-0 top-0 bottom-0 w-32 bg-[#4B3FA8]/40 items-center justify-center pointer-events-none">
        <FontAwesome5 name="landmark" size={48} color="rgba(255, 255, 255, 0.2)" />
      </View>

      {/* Card Content */}
      <View className="flex-1 pr-24 z-10">
        <Text className="text-[#FF6B57] font-bold text-xs uppercase tracking-wider mb-1">
          CONTINUE LEARNING
        </Text>

        <Text className="text-white font-extrabold text-xl mb-5 leading-tight">
          {courseTitle}
        </Text>

        <Pressable
          onPress={onContinue}
          className="bg-white px-6 py-3 rounded-full self-start active:opacity-80"
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text className="text-[#241B4A] font-bold text-sm">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
};
