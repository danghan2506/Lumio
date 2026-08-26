import { useCallback, useEffect, useRef, useState } from 'react';
import type { Call } from '@stream-io/video-react-native-sdk';
import type { TeacherCaptionEvent } from '@/types/stream';

/** How long to keep showing the last caption after the teacher stops speaking */
const CAPTION_CLEAR_DELAY_MS = 3000;

export interface UseLiveCaptionsParams {
  /** The Stream Call object to subscribe to */
  call: Call | null;
  /** Whether captions are enabled (controlled by subtitle toggle) */
  enabled: boolean;
}

export interface UseLiveCaptionsReturn {
  /** Current caption text to display */
  captionText: string;
  /** Whether a caption is actively being displayed */
  isActive: boolean;
}

export function useLiveCaptions(params: UseLiveCaptionsParams): UseLiveCaptionsReturn {
  const { call, enabled } = params;
  const [captionText, setCaptionText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCaption = useCallback(() => {
    setCaptionText('');
    setIsActive(false);
  }, []);

  const cancelClearTimer = useCallback(() => {
    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const scheduleClear = useCallback(() => {
    cancelClearTimer();
    clearTimerRef.current = setTimeout(clearCaption, CAPTION_CLEAR_DELAY_MS);
  }, [cancelClearTimer, clearCaption]);

  useEffect(() => {
    if (!call || !enabled) {
      cancelClearTimer();
      clearCaption();
      return;
    }

    const unsubscribe = call.on('custom', (event: { custom?: Record<string, unknown> }) => {
      const payload = event.custom;
      if (!payload || payload.type !== 'teacher_caption') return;

      const caption = payload as unknown as TeacherCaptionEvent;

      if (caption.text) {
        cancelClearTimer();
        setCaptionText(caption.text);
        setIsActive(true);

        // If this is the final segment of an utterance, schedule auto-clear
        if (caption.is_final) {
          scheduleClear();
        }
      } else if (caption.is_final) {
        // Empty text + is_final = turn ended, schedule clear
        scheduleClear();
      }
    });

    return () => {
      unsubscribe();
      cancelClearTimer();
    };
  }, [call, enabled, cancelClearTimer, clearCaption, scheduleClear]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      cancelClearTimer();
    };
  }, [cancelClearTimer]);

  return { captionText, isActive };
}
