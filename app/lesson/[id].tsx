import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';
import { useLessonAudioDetails } from '@/hooks/useLessonAudioDetails';
import { useAuth } from '@/hooks/useAuth';
import { useStreamLessonCall } from '@/hooks/useStreamLessonCall';
import { useStreamLessonAgent } from '@/hooks/useStreamLessonAgent';
import { recordLessonProgress } from '@/lib/api';
import type { LessonCompleteEvent } from '@/types/stream';

const AUDIO_DRAIN_MS = 1200;

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: Record<string, unknown>;
  disabled?: boolean;
  testID?: string;
}

function AnimatedButton({ children, onPress, className, style, disabled, testID }: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.9, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1.0, { damping: 10, stiffness: 300 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        className={className}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AudioLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lesson, language, loading, error } = useLessonAudioDetails(id || '');
  const { user, session } = useAuth();
  const [progressError, setProgressError] = useState<string | null>(null);
  const handleLessonCompleteRef = useRef<((payload: LessonCompleteEvent) => void) | null>(null);
  const lastPayloadRef = useRef<LessonCompleteEvent | null>(null);
  const completionProxy = useCallback((payload: LessonCompleteEvent) => {
    handleLessonCompleteRef.current?.(payload);
  }, []);
  const { isMuted, status, errorMessage, retry, toggleMute, leave, callType, callId } =
    useStreamLessonCall({
      lessonId: id || '',
      languageId: language?.id ?? '',
      displayName: user?.email ?? 'Learner',
      accessToken: session?.access_token ?? '',
      enabled: Boolean(user && session && lesson && language),
      onLessonComplete: completionProxy,
    });

  const teacher = useStreamLessonAgent({
    lessonId: id || '',
    callType: callType ?? 'audio_room',
    callId: callId ?? `lesson-${id}-${user?.id ?? ''}`,
    displayName: user?.email ?? 'Learner',
    accessToken: session?.access_token ?? '',
    enabled: Boolean(status === 'joined' && callType && callId && user && session),
  });

  const handleLessonComplete = useCallback(
    async (payload: LessonCompleteEvent) => {
      setShowSummary(true);
      setProgressError(null);
      lastPayloadRef.current = payload;
      try {
        await recordLessonProgress({
          lessonId: id || '',
          status: 'completed',
          currentActivity: 1,
          xpEarned: payload.xp_earned || lesson?.xp_reward || 0,
          minutesPracticed: payload.minutes_practiced,
        });
      } catch (err) {
        setProgressError(err instanceof Error ? err.message : 'Could not save your progress.');
      }
      setTimeout(() => {
        void teacher.stop();
        void leave();
      }, AUDIO_DRAIN_MS);
    },
    [id, lesson, teacher, leave]
  );
  handleLessonCompleteRef.current = handleLessonComplete;

  // State Variables
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  
  // Conversation state
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [tutorTranslation, setTutorTranslation] = useState<string>('');

  // Feedback metrics
  const [feedback] = useState({
    speaking: 'Excellent',
    pronunciation: 'Great',
    grammar: 'Good',
  });

  // Initialize tutor message from lesson data
  React.useEffect(() => {
    if (lesson) {
      setTutorMessage(lesson.ai_teacher_prompt || `Hello! Let's practice ${language?.name || 'language'} greetings today. Talk to me and I'll help you out.`);
      setTutorTranslation('Xin chào! Hôm nay chúng ta hãy cùng luyện tập giao tiếp. Hãy nói chuyện với tôi nhé!');
    }
  }, [lesson, language]);

  const triggerPlaySound = () => {
    setIsPlayingSound(true);
    setTimeout(() => setIsPlayingSound(false), 1200);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.lumioCoral} />
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.lumioCoral} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream, fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
          Error Loading Lesson
        </Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist, fontSize: 13, textAlign: 'center', marginBottom: 24, opacity: 0.8 }}>
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
      {/* ─── Connecting / Joining Overlay ─── */}
      {(status === 'connecting' || status === 'joining') && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            backgroundColor: colors.deepIndigo,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <ActivityIndicator size="large" color={colors.lumioCoral} />
          <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream, fontSize: 20, marginTop: 24, textAlign: 'center' }}>
            {status === 'joining' ? 'Joining call…' : 'Connecting…'}
          </Text>
          <View className="flex-row items-center mt-3 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(30,27,60,0.6)' }}>
            <View className="w-7 h-7 rounded-full items-center justify-center mr-2" style={{ backgroundColor: 'rgba(94,90,128,0.4)' }}>
              <Ionicons name="person" size={16} color={colors.cream} />
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream, fontSize: 13 }}>
              {user?.email ?? 'Learner'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-full border border-slate-700"
          >
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist, fontSize: 12 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Header Bar ─── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(94,90,128,0.2)',
        }}
      >
        {/* Left: Back button */}
        <AnimatedButton
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(94,90,128,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.cream} />
        </AnimatedButton>

        {/* Center: Title + status */}
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream, fontSize: 17 }}>
            AI Teacher
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mint, marginRight: 5 }} />
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.mint, fontSize: 11 }}>
              {status === 'joined' ? `On call` : 'Online'}
            </Text>
          </View>
        </View>

        {/* Right: XP badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              backgroundColor: colors.daylightAmber,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo, fontSize: 12 }}>
              {lesson.xp_reward} XP
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Error Banner ─── */}
      {status === 'error' && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            padding: 16,
            borderRadius: 20,
            backgroundColor: 'rgba(255,107,87,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(94,90,128,0.25)',
            alignItems: 'center',
          }}
        >
          <Ionicons name="alert-circle-outline" size={28} color={colors.lumioCoral} style={{ marginBottom: 8 }} />
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream, fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
            Couldn&apos;t connect to the audio call
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist, fontSize: 11, textAlign: 'center', marginBottom: 12, opacity: 0.75 }}>
            {errorMessage}
          </Text>
          <TouchableOpacity onPress={() => void retry()} style={{ backgroundColor: colors.lumioCoral, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream, fontSize: 12 }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Info Banner ─── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: 'rgba(94,90,128,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(94,90,128,0.2)',
          }}
        >
          <Text style={{ fontSize: 14, marginRight: 6 }}>{language?.flag || '🌐'}</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist, fontSize: 11 }}>
            {language?.name || 'Language'} • Bài {lesson.order}: {lesson.title}
          </Text>
        </View>
      </View>

      {/* ─── AI Teacher Status ─── */}
      {(teacher.status === 'connecting' || teacher.status === 'failed') && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 4,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: 'rgba(94,90,128,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(94,90,128,0.2)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {teacher.status === 'connecting' ? (
            <>
              <ActivityIndicator size="small" color={colors.daylightAmber} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist, fontSize: 11 }}>
                Teacher joining…
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={16} color={colors.lumioCoral} style={{ marginRight: 6 }} />
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lumioCoral, fontSize: 11 }}>
                Teacher unavailable
              </Text>
              <TouchableOpacity onPress={() => void teacher.retry()} style={{ marginLeft: 12 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream, fontSize: 11 }}>
                  Retry teacher
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {teacher.status === 'connected' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint, marginRight: 6 }} />
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.mint, fontSize: 11 }}>
            AI teacher present
          </Text>
        </View>
      )}

      {/* ─── Scrollable Conversation Area ─── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Section */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View
            style={{
              width: 140,
              height: 140,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Pulsing visual circles representing audio waves */}
            {isPlayingSound && (
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: `${colors.lumioCoral}33`,
                  backgroundColor: `${colors.lumioCoral}0D`,
                }}
              />
            )}
            <Image
              source={images.lumiTutor}
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                borderWidth: 3,
                borderColor: 'rgba(94,90,128,0.3)',
              }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Teacher Speech Bubble */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              padding: 18,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.06)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo, fontSize: 15, lineHeight: 22 }}>
                  {tutorMessage}
                </Text>
                {showSubtitles && (
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.slate,
                      fontSize: 13,
                      lineHeight: 19,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(0,0,0,0.06)',
                      opacity: 0.8,
                    }}
                  >
                    {tutorTranslation}
                  </Text>
                )}
              </View>
              <AnimatedButton
                onPress={triggerPlaySound}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.lumioCoral}15`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name={isPlayingSound ? 'volume-high' : 'volume-medium'} size={22} color={colors.lumioCoral} />
              </AnimatedButton>
            </View>
          </View>
        </View>

        {/* Voice Interaction Hint */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.lavenderMist,
              fontSize: 11,
              textAlign: 'center',
              opacity: 0.75,
            }}
          >
            Just talk to Lumi to practice this lesson.
          </Text>
        </View>
      </ScrollView>

      {/* ─── Pinned Bottom: Feedback + Call Controls ─── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: 'rgba(94,90,128,0.15)',
        }}
      >
        {/* Feedback Card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 16,
            borderRadius: 20,
            backgroundColor: 'rgba(94,90,128,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(94,90,128,0.15)',
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(94,90,128,0.2)' }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate, fontSize: 10 }}>
              Speaking
            </Text>
            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.mint, fontSize: 13, marginTop: 2 }}>
              {feedback.speaking}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(94,90,128,0.2)' }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate, fontSize: 10 }}>
              Pronunciation
            </Text>
            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.daylightAmber, fontSize: 13, marginTop: 2 }}>
              {feedback.pronunciation}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate, fontSize: 10 }}>
              Grammar
            </Text>
            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.lavenderMist, fontSize: 13, marginTop: 2 }}>
              {feedback.grammar}
            </Text>
          </View>
        </View>

        {/* Call Controls Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 4 }}>
          {/* Mic toggle */}
          <AnimatedButton
            testID="mic-toggle"
            onPress={() => void toggleMute()}
            disabled={status !== 'joined'}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isMuted ? colors.deepIndigo : colors.cream,
              borderWidth: 2,
              borderColor: isMuted ? colors.lumioCoral : 'transparent',
              opacity: status !== 'joined' ? 0.5 : 1,
            }}
          >
            <Ionicons name={isMuted ? 'mic-off-outline' : 'mic-outline'} size={22} color={isMuted ? colors.lumioCoral : colors.deepIndigo} />
          </AnimatedButton>

          {/* Subtitles Toggle */}
          <AnimatedButton
            onPress={() => setShowSubtitles(!showSubtitles)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: showSubtitles ? colors.cream : colors.deepIndigo,
              borderWidth: 2,
              borderColor: showSubtitles ? 'transparent' : 'rgba(94,90,128,0.4)',
            }}
          >
            <Ionicons name="chatbox-ellipses-outline" size={22} color={showSubtitles ? colors.deepIndigo : colors.cream} />
          </AnimatedButton>
        </View>
      </View>

      {/* ─── Summary Modal Sheet ─── */}
      <Modal visible={showSummary} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#1A1432',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              borderTopWidth: 1,
              borderTopColor: 'rgba(94,90,128,0.2)',
            }}
          >
            {/* Mascot header */}
            <View style={{ alignItems: 'center', marginTop: -52, marginBottom: 16 }}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: '#1A1432',
                  borderWidth: 4,
                  borderColor: 'rgba(94,90,128,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 6,
                }}
              >
                <Image source={images.lumiCelebration} style={{ width: 72, height: 72, borderRadius: 36 }} resizeMode="contain" />
              </View>
            </View>

            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream, fontSize: 24, textAlign: 'center', marginBottom: 4 }}>
              Lesson Completed!
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist, fontSize: 13, textAlign: 'center', marginBottom: 24, opacity: 0.75 }}>
              Awesome job practicing your spoken language today.
            </Text>

            {/* XP Reward card */}
            <View
              style={{
                backgroundColor: 'rgba(94,90,128,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(94,90,128,0.15)',
                padding: 16,
                borderRadius: 16,
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <View style={{ backgroundColor: colors.daylightAmber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginBottom: 4 }}>
                <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo, fontSize: 14 }}>
                  +{lesson.xp_reward} XP
                </Text>
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream, fontSize: 11, opacity: 0.9, marginTop: 4 }}>
                Daylight Amber reward ignition claimed!
              </Text>
            </View>

            {progressError && (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lumioCoral, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                  Could not save your progress: {progressError}
                </Text>
                <AnimatedButton
                  onPress={() => {
                    if (lastPayloadRef.current) void handleLessonComplete(lastPayloadRef.current);
                  }}
                  style={{
                    backgroundColor: colors.lumioCoral,
                    paddingHorizontal: 24,
                    paddingVertical: 8,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream, fontSize: 12 }}>
                    Retry
                  </Text>
                </AnimatedButton>
              </View>
            )}

            {/* User Feedback form */}
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, opacity: 0.8 }}>
              Leave Lesson Feedback (Optional)
            </Text>
            <TextInput
              placeholder="How did you find this lesson? (e.g. pronunciation feedback, speech speed...)"
              placeholderTextColor={colors.slate}
              value={userFeedback}
              onChangeText={setUserFeedback}
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.cream,
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(94,90,128,0.2)',
                marginBottom: 24,
                fontSize: 13,
                textAlignVertical: 'top',
              }}
              multiline={true}
              numberOfLines={3}
            />

            {/* Claim Reward Button */}
            <AnimatedButton
              onPress={() => {
                if (progressError) return;
                setShowSummary(false);
                router.replace('/(tabs)/learn');
              }}
              style={{
                backgroundColor: colors.lumioCoral,
                minHeight: 52,
                borderRadius: 999,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 14,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream, fontSize: 16 }}>
                Claim Rewards
              </Text>
            </AnimatedButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
