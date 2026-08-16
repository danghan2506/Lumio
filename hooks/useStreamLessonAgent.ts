import { useCallback, useEffect, useRef, useState } from 'react';
import { startStreamAgent, stopStreamAgent } from '@/lib/api';
import type { StopStreamAgentParams } from '@/types/stream';

export type StreamAgentStatus = 'idle' | 'connecting' | 'connected' | 'failed';

export interface UseStreamLessonAgentParams {
  lessonId: string;
  callType: string;
  callId: string;
  displayName: string;
  accessToken: string;
  enabled: boolean;
}

export function useStreamLessonAgent(params: UseStreamLessonAgentParams) {
  const { lessonId, callType, callId, displayName, accessToken, enabled } = params;
  const [status, setStatus] = useState<StreamAgentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startingRef = useRef(false);
  const disposedRef = useRef(false);

  const performStop = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionId(null);
    setStatus('idle');
    if (currentSessionId) {
      const params: StopStreamAgentParams = {
        callId,
        sessionId: currentSessionId,
        accessToken,
      };
      try {
        await stopStreamAgent(params);
      } catch {
        // Best-effort teardown.
      }
    }
  }, [callId, accessToken]);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setStatus('connecting');
    setErrorMessage(null);
    try {
      const agentSession = await startStreamAgent({
        lessonId,
        callType,
        callId,
        displayName,
        accessToken,
      });
      if (disposedRef.current) {
        // The hook was disabled/unmounted while start was in flight. Tear the
        // just-established server session down instead of committing it here.
        sessionIdRef.current = agentSession.sessionId;
        await performStop();
        return;
      }
      sessionIdRef.current = agentSession.sessionId;
      setSessionId(agentSession.sessionId);
      setStatus('connected');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'AI teacher could not join the lesson.'
      );
      setStatus('failed');
    } finally {
      startingRef.current = false;
    }
  }, [lessonId, callType, callId, displayName, accessToken, performStop]);

  const stop = useCallback(async () => {
    await performStop();
  }, [performStop]);

  const retry = useCallback(async () => {
    await start();
  }, [start]);

  useEffect(() => {
    if (!enabled) {
      disposedRef.current = true;
      void stop();
      return;
    }

    disposedRef.current = false;
    void start();

    return () => {
      disposedRef.current = true;
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status, errorMessage, sessionId, start, stop, retry };
}
