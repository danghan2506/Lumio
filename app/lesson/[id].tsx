import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
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

  // State Variables
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [showSummary, setShowSummary] = useState(false); // To be fully connected in Task 5
  
  // Conversation simulation state
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [tutorTranslation, setTutorTranslation] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Feedback metrics
  const [feedback, setFeedback] = useState({
    speaking: 'Excellent',
    pronunciation: 'Great',
    grammar: 'Good',
  });

  // Initialize tutor message from lesson data
  React.useEffect(() => {
    if (lesson) {
      setTutorMessage(lesson.ai_teacher_prompt || `Hello! Let's practice ${language?.name || 'language'} greetings today. Tap any phrase below to talk to me.`);
      setTutorTranslation('Xin chào! Chúng ta hãy cùng luyện tập giao tiếp hôm nay. Nhấp vào bất kỳ cụm từ nào bên dưới để trò chuyện cùng tôi.');
    }
  }, [lesson, language]);

  const handlePhrasePress = (phraseWord: string, phraseTranslation: string) => {
    if (isListening || isMuted) return;

    // 1. Show user message and set listening state
    setUserMessage(phraseWord);
    setIsListening(true);

    // 2. Simulate AI response after 1.5 seconds
    setTimeout(() => {
      setIsListening(false);
      setTutorMessage(`Perfect! Your pronunciation of "${phraseWord}" was spot on. Let's keep going!`);
      setTutorTranslation(`Hoàn hảo! Phát âm cụm từ "${phraseTranslation}" của bạn rất chuẩn xác. Hãy tiếp tục nào!`);
      
      // Randomly update feedback metrics slightly to feel dynamic
      const performanceRatings = ['Excellent', 'Great', 'Good'];
      setFeedback({
        speaking: performanceRatings[Math.floor(Math.random() * 2)],
        pronunciation: performanceRatings[Math.floor(Math.random() * 2)],
        grammar: performanceRatings[Math.floor(Math.random() * 3)],
      });
    }, 1500);
  };

  const triggerPlaySound = () => {
    setIsPlayingSound(true);
    setTimeout(() => setIsPlayingSound(false), 1200);
  };

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
      {/* Header Block */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800/40">
        <TouchableOpacity onPress={() => router.back()} style={{ minWidth: 48, minHeight: 48 }} className="items-center justify-center rounded-full bg-slate-800/20">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </TouchableOpacity>

        <View className="items-center">
          <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }} className="text-lg">
            AI Teacher
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-2 h-2 rounded-full bg-[#35D0A0] mr-1.5" />
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

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Mascot Section */}
        <View className="items-center mt-6">
          <View className="relative w-48 h-48 justify-center items-center">
            {/* Pulsing visual circles representing audio waves */}
            {(isPlayingSound || isListening) && (
              <View className="absolute inset-0 bg-[#FF6B57]/10 border-2 border-[#FF6B57]/20 rounded-full scale-125 animate-ping" />
            )}
            <Image
              source={images.lumiTutor}
              className="w-40 h-40 rounded-full border-4 border-slate-700/40"
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Teacher Speech Bubble */}
        <View className="px-6 mt-4">
          <View className="relative bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo }} className="text-base leading-6">
                  {tutorMessage}
                </Text>
                {showSubtitles && (
                  <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }} className="text-sm leading-5 mt-2 opacity-80 border-t border-slate-100 pt-2">
                    {tutorTranslation}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={triggerPlaySound} style={{ minWidth: 48, minHeight: 48 }} className="items-center justify-center bg-[#FF6B57]/10 rounded-full">
                <Ionicons name={isPlayingSound ? 'volume-high' : 'volume-medium'} size={24} color={colors.lumioCoral} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User Spoken Bubble */}
        {userMessage && (
          <View className="px-6 mt-4 items-end">
            <View style={{ backgroundColor: colors.lumioCoral }} className="p-4 rounded-3xl max-w-[80%]">
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-base">
                {userMessage}
              </Text>
              {isListening && (
                <View className="flex-row items-center mt-1">
                  <ActivityIndicator size="small" color={colors.cream} className="mr-1" />
                  <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.cream }} className="text-xs opacity-80">
                    Listening...
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Interactive Phrases selection */}
        <View className="px-6 mt-6">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.lavenderMist }} className="text-xs uppercase tracking-wider mb-3 opacity-60">
            Tap phrase to speak
          </Text>
          
          <View className="flex-row flex-wrap gap-2.5">
            {vocabularies.map((vocab) => (
              <TouchableOpacity
                key={vocab.id}
                onPress={() => handlePhrasePress(vocab.word, vocab.translation)}
                disabled={isListening || isMuted}
                style={{ backgroundColor: colors.deepIndigo, borderColor: colors.slate }}
                className="px-4 py-3 rounded-2xl border border-slate-700/50 flex-row items-center"
              >
                <Ionicons name="mic-outline" size={16} color={colors.lumioCoral} className="mr-1.5" />
                <View>
                  <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-sm">
                    {vocab.word}
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }} className="text-xs mt-0.5">
                    {vocab.pronunciation}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Call Controls and Feedback card */}
        <View className="mt-8 px-6 pb-6">
          {/* Feedback Card */}
          <View className="flex-row items-center justify-between p-4 mb-6 rounded-3xl bg-slate-800/40 border border-slate-700/30">
            <View className="flex-1 items-center border-r border-slate-700/40">
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }} className="text-xs">
                Speaking
              </Text>
              <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.mint }} className="text-sm mt-1">
                {feedback.speaking}
              </Text>
            </View>
            <View className="flex-1 items-center border-r border-slate-700/40">
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }} className="text-xs">
                Pronunciation
              </Text>
              <Text style={{ fontFamily: 'Fredoka_700Bold', color: '#63B3ED' }} className="text-sm mt-1">
                {feedback.pronunciation}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }} className="text-xs">
                Grammar
              </Text>
              <Text style={{ fontFamily: 'Fredoka_700Bold', color: '#B9F5FF' }} className="text-sm mt-1">
                {feedback.grammar}
              </Text>
            </View>
          </View>

          {/* Buttons Control Row */}
          <View className="flex-row justify-center items-center gap-6">
            {/* Mic toggle */}
            <TouchableOpacity
              onPress={() => setIsMuted(!isMuted)}
              style={{
                minWidth: 56,
                minHeight: 56,
                backgroundColor: isMuted ? colors.deepIndigo : '#FFFBF4',
                borderColor: isMuted ? colors.lumioCoral : 'transparent',
              }}
              className="w-14 h-14 rounded-full justify-center items-center border-2"
            >
              <Ionicons name={isMuted ? 'mic-off-outline' : 'mic-outline'} size={24} color={isMuted ? colors.lumioCoral : colors.deepIndigo} />
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              onPress={() => setShowSummary(true)}
              style={{ minWidth: 64, minHeight: 64 }}
              className="w-16 h-16 rounded-full bg-red-500 justify-center items-center shadow-lg"
            >
              <Ionicons name="call-outline" size={28} color="#FFFBF4" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* Subtitles Toggle */}
            <TouchableOpacity
              onPress={() => setShowSubtitles(!showSubtitles)}
              style={{
                minWidth: 56,
                minHeight: 56,
                backgroundColor: showSubtitles ? '#FFFBF4' : colors.deepIndigo,
                borderColor: showSubtitles ? 'transparent' : colors.slate,
              }}
              className="w-14 h-14 rounded-full justify-center items-center border-2"
            >
              <Ionicons name="chatbox-ellipses-outline" size={24} color={showSubtitles ? colors.deepIndigo : colors.cream} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
