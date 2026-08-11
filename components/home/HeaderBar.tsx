import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface HeaderBarProps {
  userName: string;
  languageFlag: string;
  languageName: string;
  streak: number;
  onLanguagePress?: () => void;
  onNotificationPress?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userName,
  languageFlag,
  languageName,
  streak,
  onLanguagePress,
  onNotificationPress,
}) => {
  // Determine greeting based on language
  const getGreetingPrefix = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'spanish':
      case 'español':
        return 'Hola';
      case 'french':
      case 'français':
        return 'Bonjour';
      case 'korean':
      case '한국어':
        return '안녕';
      default:
        return 'Hello';
    }
  };

  const greeting = `${getGreetingPrefix(languageName)}, ${userName}! 👋`;

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-[#FFFBF4]">
      {/* Language Badge & User Greeting */}
      <Pressable
        onPress={onLanguagePress}
        className="flex-row items-center space-x-2"
      >
        <Text className="text-2xl mr-1">{languageFlag}</Text>
        <Text className="text-[#241B4A] font-bold text-xl">{greeting}</Text>
      </Pressable>

      {/* Right Controls */}
      <View className="flex-row items-center space-x-3">
        {/* Streak Flame Badge */}
        <View className="flex-row items-center bg-[#FFB74D]/20 px-3 py-1.5 rounded-full border border-[#FFB74D]/40">
          <Ionicons name="flame" size={18} color="#FFB74D" />
          <Text className="text-[#241B4A] font-bold text-sm ml-1">{String(streak)}</Text>
        </View>

        {/* Notification Bell */}
        <Pressable
          onPress={onNotificationPress}
          className="w-10 h-10 rounded-full bg-[#EAE6FF]/60 items-center justify-center border border-[#5E5A80]/15"
          testID="notification-button"
        >
          <Ionicons name="notifications-outline" size={20} color="#241B4A" />
        </Pressable>
      </View>
    </View>
  );
};
