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
  }, [lessonId, callType, callId, displayName, accessToken]);

  const stop = useCallback(async () => {
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

  const retry = useCallback(async () => {
    await start();
  }, [start]);

  useEffect(() => {
    if (!enabled) {
      if (sessionIdRef.current) {
        void stop();
      }
      return;
    }
    void start();

    return () => {
      if (sessionIdRef.current) {
        void stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status, errorMessage, sessionId, start, stop, retry };
}