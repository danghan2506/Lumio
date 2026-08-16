import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStreamLessonCall } from '../../hooks/useStreamLessonCall';
import { createStreamLessonSession } from '../../lib/api';
import { getStreamClient, disconnectStreamUser } from '../../lib/stream';

jest.mock('../../lib/api', () => ({
  createStreamLessonSession: jest.fn(),
}));
jest.mock('../../lib/stream', () => ({
  getStreamClient: jest.fn(),
  disconnectStreamUser: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@stream-io/video-react-native-sdk', () => ({
  StreamVideoClient: {},
  CallingState: { LEFT: 'left' },
}));

const createCall = jest.fn((type: string, id: string) => ({
  type,
  id,
  state: { callingState: 'joined' },
  camera: { disable: jest.fn().mockResolvedValue(undefined) },
  microphone: {
    disable: jest.fn().mockResolvedValue(undefined),
    enable: jest.fn().mockResolvedValue(undefined),
    toggle: jest.fn().mockResolvedValue(undefined),
  },
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
}));

const baseParams = {
  lessonId: 'l1',
  languageId: 'en',
  displayName: 'Alex',
  accessToken: 'jwt',
  enabled: true,
};

const session = {
  apiKey: 'key',
  userId: 'u1',
  token: 'tok',
  callType: 'audio_room',
  callId: 'lesson-l1-u1',
};

describe('useStreamLessonCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createStreamLessonSession as jest.Mock).mockResolvedValue(session);
    (getStreamClient as jest.Mock).mockReturnValue({
      call: createCall,
      disconnectUser: jest.fn(),
    } as unknown as StreamVideoClient);
  });

  it('goes idle -> connecting -> joining -> joined when enabled', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    expect(result.current.status).toBe('connecting');

    await waitFor(() => expect(result.current.status).toBe('joined'));
    expect(getStreamClient).toHaveBeenCalledWith({
      apiKey: 'key',
      userId: 'u1',
      token: 'tok',
    });
    expect(createCall).toHaveBeenCalledWith('audio_room', 'lesson-l1-u1', {
      reuseInstance: true,
    });
    // SDK auto-manages audio routing on join(); join must NOT pass create: true
    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    expect(call.join).toHaveBeenCalledWith();
    expect(result.current.isMuted).toBe(false);
  });

  it('sets error status and retry can recover', async () => {
    (createStreamLessonSession as jest.Mock).mockRejectedValueOnce(new Error('Network down'));
    const { result } = renderHook(() => useStreamLessonCall(baseParams));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Network down');

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe('joined');
  });

  it('toggles mute on the call microphone', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    await waitFor(() => expect(result.current.status).toBe('joined'));

    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    await act(async () => {
      await result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(true);
    expect(call.microphone.disable).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(false);
    expect(call.microphone.enable).toHaveBeenCalledTimes(1);
  });

  it('leave() leaves the call, disconnects, sets ended', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    await waitFor(() => expect(result.current.status).toBe('joined'));

    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    await act(async () => {
      await result.current.leave();
    });
    expect(call.leave).toHaveBeenCalledTimes(1);
    expect(disconnectStreamUser).toHaveBeenCalled();
    expect(result.current.status).toBe('ended');
  });

  it('exposes callType and callId from the session after joining', async () => {
    const { result } = renderHook(() => useStreamLessonCall(baseParams));
    expect(result.current.callType).toBeNull();
    expect(result.current.callId).toBeNull();
    await waitFor(() => expect(result.current.status).toBe('joined'));
    expect(result.current.callType).toBe('audio_room');
    expect(result.current.callId).toBe('lesson-l1-u1');
  });

  it('does not double-leave on unmount after manual leave()', async () => {
    const { result, unmount } = renderHook(() => useStreamLessonCall(baseParams));
    await waitFor(() => expect(result.current.status).toBe('joined'));

    const call = createCall.mock.results[createCall.mock.results.length - 1].value;
    await act(async () => {
      await result.current.leave();
    });
    unmount();
    expect(call.leave).toHaveBeenCalledTimes(1);
  });
});