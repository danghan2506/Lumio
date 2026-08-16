import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AudioLessonScreen from '@/app/lesson/[id]';

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

let mockAgentStatus = 'connected';
const mockAgentRetry = jest.fn();

jest.mock('@/hooks/useStreamLessonCall', () => ({
  useStreamLessonCall: () => ({
    status: mockStatus,
    isMuted: mockIsMuted,
    errorMessage: 'Could not connect to the audio call.',
    callType: 'audio_room',
    callId: 'lesson-les-1-user-1',
    join: mockJoin,
    retry: mockRetry,
    toggleMute: mockToggleMute,
    leave: mockLeave,
  }),
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

  it('end call presses leave and opens summary modal', () => {
    mockStatus = 'joined';
    const { getByTestId, getByText } = render(<AudioLessonScreen />);
    fireEvent.press(getByTestId('end-call'));
    expect(mockLeave).toHaveBeenCalled();
    expect(getByText('Lesson Completed!')).toBeTruthy();
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
