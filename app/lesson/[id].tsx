import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';
import { useLessonAudioDetails } from '@/hooks/useLessonAudioDetails';

export default function AudioLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lesson, unit, language, vocabularies, loading, error } = useLessonAudioDetails(id || '');

  // State placeholders
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }} className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.lumioCoral} />
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }} className="justify-center items-center p-6">
        <Ionicons name="alert-circle-outline" size={48} color={colors.lumioCoral} className="mb-4" />
        <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }} className="text-xl text-center mb-2">
          Error Loading Lesson
        </Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }} className="text-sm text-center mb-6 opacity-80">
          {error || 'Lesson not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="px-6 py-3 rounded-full bg-slate-800 border border-slate-700">
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-xs">
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800/40">
        <TouchableOpacity onPress={() => router.back()} style={{ minWidth: 48, minHeight: 48 }} className="items-center justify-center rounded-full bg-slate-800/20">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </TouchableOpacity>

        <View className="items-center">
          <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }} className="text-lg">
            AI Teacher
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-2 h-2 rounded-full bg-[#35D0A0] mr-1.5 animate-pulse" />
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.mint }} className="text-xs">
              Online
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity style={{ minWidth: 48, minHeight: 48 }} className="items-center justify-center rounded-full bg-slate-800/20 opacity-40">
            <Ionicons name="videocam-outline" size={20} color={colors.cream} />
          </TouchableOpacity>

          <View style={{ backgroundColor: colors.daylightAmber }} className="flex-row items-center px-3 py-1.5 rounded-full">
            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }} className="text-xs">
              {lesson.xp_reward} XP
            </Text>
          </View>

          <TouchableOpacity style={{ minWidth: 48, minHeight: 48 }} className="items-center justify-center rounded-full bg-slate-800/20">
            <Ionicons name="person-outline" size={20} color={colors.cream} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Banner */}
      <View className="px-4 py-2 mt-2 items-center">
        <View className="flex-row items-center px-4 py-2 rounded-full bg-slate-800/40 border border-slate-700/30">
          <Text className="text-sm mr-2">{language?.flag || '🌐'}</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }} className="text-xs">
            {language?.name || 'Language'} • Bài {lesson.order}: {lesson.title}
          </Text>
        </View>
      </View>
      
      {/* Placeholder spacer */}
      <View className="flex-1" />
    </SafeAreaView>
  );
}
