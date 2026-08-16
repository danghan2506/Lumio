import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStreamLessonAgent } from '../../hooks/useStreamLessonAgent';
import { startStreamAgent, stopStreamAgent } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  startStreamAgent: jest.fn(),
  stopStreamAgent: jest.fn().mockResolvedValue(undefined),
}));

const baseParams = {
  lessonId: 'l1',
  callType: 'audio_room',
  callId: 'lesson-l1-u1',
  displayName: 'Alex',
  accessToken: 'jwt',
  enabled: false,
};

const agentSession = { sessionId: 'sess-1', callId: 'lesson-l1-u1', agentUserId: 'lumi-teacher' };

describe('useStreamLessonAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (startStreamAgent as jest.Mock).mockResolvedValue(agentSession);
  });

  it('is idle and does not start when disabled', () => {
    const { result } = renderHook(() => useStreamLessonAgent(baseParams));
    expect(result.current.status).toBe('idle');
    expect(startStreamAgent).not.toHaveBeenCalled();
  });

  it('goes idle -> connecting -> connected when enabled', async () => {
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(startStreamAgent).toHaveBeenCalledWith({
      lessonId: 'l1',
      callType: 'audio_room',
      callId: 'lesson-l1-u1',
      displayName: 'Alex',
      accessToken: 'jwt',
    });
    expect(result.current.sessionId).toBe('sess-1');
  });

  it('sets failed status and retry can recover', async () => {
    (startStreamAgent as jest.Mock).mockRejectedValueOnce(new Error('Agent server down'));
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.errorMessage).toBe('Agent server down');

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe('connected');
    expect(startStreamAgent).toHaveBeenCalledTimes(2);
  });

  it('prevents a double start while already connecting', async () => {
    let resolveConnect: ((value: typeof agentSession) => void) | null = null;
    (startStreamAgent as jest.Mock).mockImplementation(
      () => new Promise((resolve) => (resolveConnect = resolve))
    );
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));

    await waitFor(() => expect(result.current.status).toBe('connecting'));
    expect(startStreamAgent).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.start();
      expect(startStreamAgent).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      resolveConnect?.(agentSession);
    });
    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(startStreamAgent).toHaveBeenCalledTimes(1);
  });

  it('stop() clears session and best-effort stops when already stopped', async () => {
    const { result } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));
    await waitFor(() => expect(result.current.status).toBe('connected'));

    await act(async () => {
      await result.current.stop();
    });
    expect(stopStreamAgent).toHaveBeenCalledWith({
      callId: 'lesson-l1-u1',
      sessionId: 'sess-1',
      accessToken: 'jwt',
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.sessionId).toBeNull();
  });

  it('stops the agent on unmount', async () => {
    const { result, unmount } = renderHook(() => useStreamLessonAgent({ ...baseParams, enabled: true }));
    await waitFor(() => expect(result.current.status).toBe('connected'));

    unmount();
    expect(stopStreamAgent).toHaveBeenCalled();
  });
});