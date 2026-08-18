import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AudioLessonScreen from '@/app/lesson/[id]';
import { recordLessonProgress } from '@/lib/api';
import type { LessonCompleteEvent } from '@/types/stream';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: 'les-1' }),
}));

jest.mock('@/hooks/useLessonAudioDetails', () => ({
  useLessonAudioDetails: () => ({
    lesson: {
      id: 'les-1',
      unit_id: 'u1',
      order: 1,
      title: 'Basic Greetings',
      xp_reward: 10,
      estimated_minutes: 5,
      ai_teacher_prompt: 'Hello!',
      created_at: '2026-01-01T00:00:00Z',
    },
    unit: { id: 'u1' },
    language: { id: 'en', name: 'English', flag: '🇬🇧' },
    vocabularies: [],
    loading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: {
      access_token: 'jwt',
      user: { id: 'user-1', email: 'alex@example.com' },
    } as never,
    user: { id: 'user-1', email: 'alex@example.com' } as never,
    loading: false,
    signOut: jest.fn(),
  }),
}));

let mockStatus = 'connecting';
let mockIsMuted = false;
const mockJoin = jest.fn();
const mockRetry = jest.fn();
const mockLeave = jest.fn();
const mockToggleMute = jest.fn();

let mockOnLessonComplete: ((payload: LessonCompleteEvent) => void) | null = null;

let mockAgentStatus = 'connected';
const mockAgentRetry = jest.fn();

jest.mock('@/hooks/useStreamLessonCall', () => ({
  useStreamLessonCall: (params: { onLessonComplete?: (payload: LessonCompleteEvent) => void }) => {
    mockOnLessonComplete = params.onLessonComplete ?? null;
    return {
      status: mockStatus,
      isMuted: mockIsMuted,
      errorMessage: 'Could not connect to the audio call.',
      callType: 'audio_room',
      callId: 'lesson-les-1-user-1',
      join: mockJoin,
      retry: mockRetry,
      toggleMute: mockToggleMute,
      leave: mockLeave,
    };
  },
}));

jest.mock('@/lib/api', () => ({
  recordLessonProgress: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/hooks/useStreamLessonAgent', () => ({
  useStreamLessonAgent: () => ({
    status: mockAgentStatus,
    errorMessage: 'Agent server unreachable.',
    sessionId: 'sess-1',
    start: jest.fn(),
    stop: jest.fn(),
    retry: mockAgentRetry,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { Ionicons: (props: any) => React.createElement('Ionicons', props) };
});

describe('AudioLessonScreen stream call states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatus = 'connecting';
    mockIsMuted = false;
    mockAgentStatus = 'connected';
    mockOnLessonComplete = null;
    (recordLessonProgress as jest.Mock).mockClear();
  });

  it('shows connecting overlay with the user name while connecting', async () => {
    const { getByText } = render(<AudioLessonScreen />);
    expect(getByText('Connecting…')).toBeTruthy();
    expect(getByText('alex@example.com')).toBeTruthy();
  });

  it('shows error card and retry triggers retry()', () => {
    mockStatus = 'error';
    const { getByText } = render(<AudioLessonScreen />);
    expect(getByText(/Couldn't connect to the audio call/i)).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(mockRetry).toHaveBeenCalled();
  });

  it('muted mic button reflects isMuted and press triggers toggleMute', () => {
    mockStatus = 'joined';
    mockIsMuted = true;
    const { getByTestId } = render(<AudioLessonScreen />);
    expect(getByTestId('mic-toggle')).toBeTruthy();
    fireEvent.press(getByTestId('mic-toggle'));
    expect(mockToggleMute).toHaveBeenCalled();
  });

  it('does not render an end-call button (auto-completion only)', () => {
    mockStatus = 'joined';
    const { queryByTestId } = render(<AudioLessonScreen />);
    expect(queryByTestId('end-call')).toBeNull();
  });

  it('records progress and shows the summary on lesson_complete', async () => {
    mockStatus = 'joined';
    const { getByText } = render(<AudioLessonScreen />);

    await act(async () => {
      mockOnLessonComplete?.({
        type: 'lesson_complete',
        lesson_id: 'les-1',
        xp_earned: 10,
        minutes_practiced: 2,
        reason: 'mastered',
      });
    });

    expect(recordLessonProgress).toHaveBeenCalledWith({
      lessonId: 'les-1',
      status: 'completed',
      currentActivity: 1,
      xpEarned: 10,
      minutesPracticed: 2,
    });
    expect(getByText('Lesson Completed!')).toBeTruthy();
  });

  it('blocks navigation and shows a retry when progress recording fails', async () => {
    mockStatus = 'joined';
    (recordLessonProgress as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    const { getByText } = render(<AudioLessonScreen />);

    await act(async () => {
      mockOnLessonComplete?.({ type: 'lesson_complete', lesson_id: 'les-1', xp_earned: 10, minutes_practiced: 2 });
    });

    expect(getByText(/could not save/i)).toBeTruthy();
    expect(getByText(/retry/i)).toBeTruthy();
  });

  it('shows teacher failed state and retry button', () => {
    mockStatus = 'joined';
    mockAgentStatus = 'failed';
    const { getByText } = render(<AudioLessonScreen />);
    expect(getByText(/Teacher unavailable/i)).toBeTruthy();
    fireEvent.press(getByText(/Retry teacher/i));
    expect(mockAgentRetry).toHaveBeenCalled();
  });
});
