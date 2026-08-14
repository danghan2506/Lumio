# AI Teacher Audio Lesson Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-fidelity, interactive, audio-only AI Teacher Lesson screen where users can see dynamic lesson details from Supabase and simulate a voice practice session.

**Architecture:** Create `app/lesson/[id].tsx` as the screen route, integrating a custom hook `useLessonAudioDetails` for fetching data from Supabase, managing simulated session states, and displaying feedback and summary sheets.

**Tech Stack:** React Native, Expo Router, NativeWind (Tailwind CSS v4), Zustand, Supabase client (`lib/supabase.ts`), Lucide/Ionicons.

## Global Constraints
- **Colors:** Deep Indigo (`#241B4A`), Lumio Coral (`#FF6B57`), Daylight Amber (`#FFB74D`), Mint (`#35D0A0`), Lavender Mist (`#EAE6FF`), Cream (`#FFFBF4`), Slate (`#5E5A80`).
- **Typography:** `Fredoka` for display/badges/titles, `Plus Jakarta Sans` for body/descriptions.
- **SafeAreaView:** Always use inline styles for styling `SafeAreaView` as specified in `AGENTS.md` (e.g. `style={{ flex: 1, backgroundColor: '#241B4A' }}`).
- **Interactive targets:** All tap targets must maintain a minimum of `48px`.

---

### Task 1: Supabase Data Fetching Hook

**Files:**
- Create: `hooks/useLessonAudioDetails.ts`

**Interfaces:**
- Consumes: Supabase client from `lib/supabase.ts`
- Produces: `useLessonAudioDetails(lessonId: string)` hook returning loading, error, lesson, language, unit, and vocabularies.

- [ ] **Step 1: Create the custom hook file**
  Create `hooks/useLessonAudioDetails.ts` with the following implementation:
  ```typescript
  import { useEffect, useState } from 'react';
  import { supabase } from '@/lib/supabase';
  import type { LessonRow, VocabularyRow, UnitRow, LanguageRow } from '@/types/database.types';

  export interface LessonDetails {
    lesson: LessonRow | null;
    unit: UnitRow | null;
    language: LanguageRow | null;
    vocabularies: VocabularyRow[];
  }

  export function useLessonAudioDetails(lessonId: string) {
    const [data, setData] = useState<LessonDetails>({
      lesson: null,
      unit: null,
      language: null,
      vocabularies: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!lessonId) return;

      async function fetchData() {
        setLoading(true);
        setError(null);
        try {
          // Fetch lesson
          const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .maybeSingle();

          if (lessonError) throw lessonError;
          if (!lessonData) throw new Error('Lesson not found');

          // Fetch vocabularies
          const { data: vocabData, error: vocabError } = await supabase
            .from('vocabularies')
            .select('*')
            .eq('lesson_id', lessonId);

          if (vocabError) throw vocabError;

          // Fetch unit
          const { data: unitData, error: unitError } = await supabase
            .from('units')
            .select('*')
            .eq('id', lessonData.unit_id)
            .maybeSingle();

          if (unitError) throw unitError;

          // Fetch language
          let langData = null;
          if (unitData) {
            const { data: lData, error: lError } = await supabase
              .from('languages')
              .select('*')
              .eq('id', unitData.language_id)
              .maybeSingle();

            if (lError) throw lError;
            langData = lData;
          }

          setData({
            lesson: lessonData,
            unit: unitData,
            language: langData,
            vocabularies: vocabData || [],
          });
        } catch (err: any) {
          setError(err.message || 'Failed to fetch lesson details');
        } finally {
          setLoading(false);
        }
      }

      void fetchData();
    }, [lessonId]);

    return { ...data, loading, error };
  }
  ```

- [ ] **Step 2: Run typecheck to verify there are no TypeScript errors**
  Run: `npm run typecheck`
  Expected: No compilation errors.

- [ ] **Step 3: Commit hook setup**
  Run:
  ```bash
  git add hooks/useLessonAudioDetails.ts
  git commit -m "feat: add useLessonAudioDetails hook for fetching Supabase data"
  ```

---

### Task 2: Screen Scaffold, Header & Info Banner

**Files:**
- Create: `app/lesson/[id].tsx`

**Interfaces:**
- Consumes: `useLessonAudioDetails` hook.

- [ ] **Step 1: Scaffold the screen layout and Header**
  Create `app/lesson/[id].tsx` with standard imports, router logic, and basic layout structure:
  ```tsx
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
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-sm">
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
  ```

- [ ] **Step 2: Commit initial screen structure**
  Run:
  ```bash
  git add app/lesson/\[id\].tsx
  git commit -m "feat: scaffold AI Teacher lesson screen and header layouts"
  ```

---

### Task 3: Mascot Visuals & Simulated Conversation Speech Bubble

**Files:**
- Modify: `app/lesson/[id].tsx`

- [ ] **Step 1: Add mascot view, speech bubbles, and interactive dialogue simulation**
  Open `app/lesson/[id].tsx` and implement the Mascot image, Soundwave icon, Speech Bubble, and simulated speaking action states.
  Update the component file:
  ```tsx
  // ... imports ...
  import { Animated } from 'react-native';

  export default function AudioLessonScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { lesson, unit, language, vocabularies, loading, error } = useLessonAudioDetails(id || '');

    // State Variables
    const [isMuted, setIsMuted] = useState(false);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [isPlayingSound, setIsPlayingSound] = useState(false);
    
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
      // Error screen block (Keep from step 1)
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
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-sm">
              Go Back
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
        {/* Header Block (from Task 2) */}
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

        {/* Info Banner (from Task 2) */}
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
                <View className="absolute inset-0 bg-coral-500/10 border-2 border-coral-500/20 rounded-full scale-125 animate-ping" />
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
                <TouchableOpacity onPress={triggerPlaySound} style={{ minWidth: 48, minHeight: 48 }} className="items-center justify-center bg-coral-500/10 rounded-full">
                  <Ionicons name={isPlayingSound ? 'volume-high' : 'volume-medium'} size={24} color={colors.lumioCoral} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* User Spoken Bubble */}
          {userMessage && (
            <View className="px-6 mt-4 items-end">
              <View className="bg-coral-500 p-4 rounded-3xl max-w-[80%] border-br-none">
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

          {/* Placeholder for Task 4 features */}
          <View className="h-64" />
        </ScrollView>
      </SafeAreaView>
    );
  }
  ```

- [ ] **Step 2: Verify typescript checking passes**
  Run: `npm run typecheck`
  Expected: Success without compilation issues.

- [ ] **Step 3: Commit dialog section changes**
  Run:
  ```bash
  git commit -am "feat: add mascot visual container, speech bubble and dialog simulator"
  ```

---

### Task 4: Control Bar, Target Phrases Grid & Feedback Card

**Files:**
- Modify: `app/lesson/[id].tsx`

- [ ] **Step 1: Replace placeholder and add Control Bar, Phrases grid and Feedback Card**
  Open `app/lesson/[id].tsx` and implement the remaining UI blocks: the clickable target vocabulary phrases grid, session control triggers (Mic, Subtitles, End Call), and the feedback ratings container.
  Let's replace the bottom portion:
  ```tsx
  // ... replace imports and add custom variables ...
  ```
  Implement the structure:
  ```tsx
  {/* Inside ScrollView, replace the placeholder with Phrases selection */}
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
  <View className="mt-auto px-6 pb-6">
    {/* Feedback Card */}
    <View className="flex-row items-center justify-between p-4 mb-4 rounded-3xl bg-slate-800/40 border border-slate-700/30">
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
        onPress={() => setShowSummary(true)} // Toggles the summary modal
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
  ```

- [ ] **Step 2: Verify code structure compiles without issues**
  Run: `npm run typecheck`
  Expected: Success without compilation issues.

- [ ] **Step 3: Commit control triggers and feedback components**
  Run:
  ```bash
  git commit -am "feat: add interactive phrases list, audio call triggers and feedback container"
  ```

---

### Task 5: End-of-Call Summary sheet & Complete Integration

**Files:**
- Modify: `app/lesson/[id].tsx`

- [ ] **Step 1: Implement the Modal Summary Sheet**
  Open `app/lesson/[id].tsx` and define the `showSummary` state, rendering a beautiful full-screen modal overlays to summarize user rewards (XP) and receive text feedback.
  Add code:
  ```tsx
  import { Modal, TextInput } from 'react-native';

  // Inside AudioLessonScreen component:
  const [showSummary, setShowSummary] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  
  // Renders the Modal container inside the root view:
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      {/* ... Existing UI ... */}

      {/* Summary Modal Sheet */}
      <Modal visible={showSummary} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-[32px] p-6 border-t border-slate-800">
            {/* Mascot header */}
            <View className="items-center -mt-16 mb-4">
              <View className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 items-center justify-center p-2">
                <Image source={images.lumiCelebration} className="w-20 h-20 rounded-full" resizeMode="contain" />
              </View>
            </View>

            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }} className="text-2xl text-center mb-1">
              Lesson Completed!
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }} className="text-sm text-center mb-6 opacity-75">
              Awesome job practicing your spoken English today.
            </Text>

            {/* XP Reward card */}
            <View className="bg-slate-800/50 border border-slate-700/30 p-4 rounded-2xl items-center mb-6">
              <View style={{ backgroundColor: colors.daylightAmber }} className="px-4 py-2 rounded-full mb-1">
                <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }} className="text-sm">
                  +{lesson.xp_reward} XP
                </Text>
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }} className="text-xs opacity-90 mt-1">
                Daylight Amber reward ignition claimed!
              </Text>
            </View>

            {/* User Feedback form */}
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }} className="text-xs uppercase tracking-wide mb-2 opacity-80">
              Leave Lesson Feedback (Optional)
            </Text>
            <TextInput
              placeholder="How did you find this lesson? (e.g. pronunciation feedback, speech speed...)"
              placeholderTextColor={colors.slate}
              value={userFeedback}
              onChangeText={setUserFeedback}
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.cream, backgroundColor: 'rgba(255,255,255,0.03)' }}
              className="p-4 rounded-xl border border-slate-800/80 mb-6 text-sm"
              multiline={true}
              numberOfLines={3}
            />

            {/* Claim Reward Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSummary(false);
                router.replace('/(tabs)/learn');
              }}
              style={{ backgroundColor: colors.lumioCoral }}
              className="py-4 rounded-full items-center justify-center mb-2"
            >
              <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }} className="text-base">
                Claim Rewards
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
  ```

- [ ] **Step 2: Run linter and typecheck tests to verify integration is clean**
  Run: `npm run lint` and `npm run typecheck`
  Expected: No linting or typing errors.

- [ ] **Step 3: Commit and push integration**
  Run:
  ```bash
  git commit -am "feat: add End Call summary modal sheet and finish screen integration"
  ```
