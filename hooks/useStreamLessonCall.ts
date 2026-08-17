import { useCallback, useEffect, useRef, useState } from 'react';
import { Call, CallingState, StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { createStreamLessonSession } from '@/lib/api';
import type { StreamLessonSession } from '@/types/stream';
import { getStreamClient, disconnectStreamUser } from '@/lib/stream';

export type StreamCallStatus =
  | 'idle'
  | 'connecting'
  | 'joining'
  | 'joined'
  | 'ended'
  | 'error';

export interface UseStreamLessonCallParams {
  lessonId: string;
  languageId: string;
  displayName: string;
  accessToken: string;
  enabled: boolean;
}

export function useStreamLessonCall(params: UseStreamLessonCallParams) {
  const { lessonId, languageId, displayName, accessToken, enabled } = params;
  const [status, setStatus] = useState<StreamCallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callMeta, setCallMeta] = useState<{
    callType: string;
    callId: string;
  } | null>(null);
  const callRef = useRef<Call | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);

  const disconnect = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    await disconnectStreamUser(client);
  }, []);

  const join = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage(null);

    let sessionData: StreamLessonSession;
    try {
      sessionData = await createStreamLessonSession({
        lessonId,
        languageId,
        displayName,
        accessToken,
      });
      setCallMeta({
        callType: sessionData.callType,
        callId: sessionData.callId,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not start the audio call.'
      );
      setStatus('error');
      return;
    }

    try {
      const client = getStreamClient({
        apiKey: sessionData.apiKey,
        userId: sessionData.userId,
        token: sessionData.token,
      });
      clientRef.current = client;

      const call = client.call(sessionData.callType, sessionData.callId, {
        reuseInstance: true,
      });
      callRef.current = call;

      setStatus('joining');
      // The call was already created server-side; the SDK auto-starts audio
      // routing (communicator) and applies mic/camera defaults on join().
      await call.join();
      setStatus('joined');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not connect to the audio call.'
      );
      setStatus('error');
    }
  }, [lessonId, languageId, displayName, accessToken]);

  const retry = useCallback(async () => {
    await join();
  }, [join]);

  const toggleMute = useCallback(async () => {
    const call = callRef.current;
    if (!call || status !== 'joined') return;

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      if (nextMuted) {
        await call.microphone.disable();
      } else {
        await call.microphone.enable();
      }
    } catch {
      // Keep optimistic state; SDK reconciles on next toggle.
    }
  }, [status, isMuted]);

  const leave = useCallback(async () => {
    const call = callRef.current;
    callRef.current = null;
    if (call && call.state.callingState !== CallingState.LEFT) {
      try {
        await call.leave();
      } catch {
        // Best-effort teardown.
      }
    }
    await disconnect();
    setCallMeta(null);
    setStatus('ended');
  }, [disconnect]);

  useEffect(() => {
    if (!enabled) return;
    void join();

    return () => {
      const call = callRef.current;
      if (call && call.state.callingState !== CallingState.LEFT) {
        void call.leave().catch(() => {});
      }
      void disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    status,
    isMuted,
    errorMessage,
    callType: callMeta?.callType ?? null,
    callId: callMeta?.callId ?? null,
    join,
    retry,
    toggleMute,
    leave,
  };
}
