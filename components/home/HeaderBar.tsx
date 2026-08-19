import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface HeaderBarProps {
  userName: string;
  languageFlag: string;
  languageName: string;
  streak: number;
  isStreakActiveToday?: boolean;
  avatarUrl?: string | null;
  onLanguagePress?: () => void;
  onNotificationPress?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userName,
  languageFlag,
  languageName,
  streak,
  isStreakActiveToday = true,
  onLanguagePress,
  onNotificationPress,
}) => {
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
    <View className="flex-row items-center justify-between px-6 py-4 bg-cream">
      <Pressable
        onPress={onLanguagePress}
        className="flex-row items-center space-x-2 active:opacity-80 flex-1 mr-3"
      >
        <Text className="text-2xl mr-1">{languageFlag}</Text>
        <Text className="text-deep-indigo font-display text-xl" numberOfLines={1}>
          {greeting}
        </Text>
      </Pressable>

      <View className="flex-row items-center space-x-3">
        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full border ${
            isStreakActiveToday || streak === 0
              ? 'bg-daylight-amber/20 border-daylight-amber/40'
              : 'bg-lavender-mist/50 border-slate/20 opacity-70'
          }`}
        >
          <Ionicons name="flame" size={18} color="#FFB74D" />
          <Text className="text-deep-indigo font-display text-sm ml-1">
            {String(streak)}
          </Text>
        </View>

        <Pressable
          onPress={onNotificationPress}
          className="w-10 h-10 rounded-full bg-lavender-mist/60 items-center justify-center border border-slate/15"
          testID="notification-button"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.deepIndigo} />
        </Pressable>
      </View>
    </View>
  );
};
