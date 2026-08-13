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
    if (!lessonId) {
      setLoading(false);
      return;
    }

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch lesson details';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [lessonId]);

  return { ...data, loading, error };
}
