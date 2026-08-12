export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          }
        ];
      };
      user_languages: {
        Row: {
          user_id: string;
          language_id: string;
          is_active: boolean;
          started_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          language_id: string;
          is_active?: boolean;
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          language_id?: string;
          is_active?: boolean;
          started_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          user_id: string;
          lesson_id: string;
          status: string;
          current_activity: number;
          attempts: number;
          xp_earned: number;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          status?: string;
          current_activity?: number;
          attempts?: number;
          xp_earned?: number;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          status?: string;
          current_activity?: number;
          attempts?: number;
          xp_earned?: number;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      vocabulary_progress: {
        Row: {
          user_id: string;
          vocabulary_id: string;
          lesson_id: string;
          status: string;
          correct_count: number;
          incorrect_count: number;
          repetitions: number;
          ease_factor: number;
          interval_days: number;
          due_at: string;
          last_reviewed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          vocabulary_id: string;
          lesson_id: string;
          status?: string;
          correct_count?: number;
          incorrect_count?: number;
          repetitions?: number;
          ease_factor?: number;
          interval_days?: number;
          due_at?: string;
          last_reviewed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          vocabulary_id?: string;
          lesson_id?: string;
          status?: string;
          correct_count?: number;
          incorrect_count?: number;
          repetitions?: number;
          ease_factor?: number;
          interval_days?: number;
          due_at?: string;
          last_reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_activity: {
        Row: {
          user_id: string;
          activity_date: string;
          xp_earned: number;
          lessons_completed: number;
          vocabulary_reviews: number;
          minutes_practiced: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          activity_date: string;
          xp_earned?: number;
          lessons_completed?: number;
          vocabulary_reviews?: number;
          minutes_practiced?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          activity_date?: string;
          xp_earned?: number;
          lessons_completed?: number;
          vocabulary_reviews?: number;
          minutes_practiced?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      languages: {
        Row: {
          id: string;
          name: string;
          native_name: string;
          flag: string;
          learner_language: string;
          badge: string | null;
          learner_count: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          native_name: string;
          flag: string;
          learner_language?: string;
          badge?: string | null;
          learner_count?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          native_name?: string;
          flag?: string;
          learner_language?: string;
          badge?: string | null;
          learner_count?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          language_id: string;
          order: number;
          title: string;
          description: string;
          icon_emoji: string;
          created_at: string;
        };
        Insert: {
          id: string;
          language_id: string;
          order: number;
          title: string;
          description: string;
          icon_emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          language_id?: string;
          order?: number;
          title?: string;
          description?: string;
          icon_emoji?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_language_id_fkey";
            columns: ["language_id"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedSchema: "public";
            referencedColumns: ["id"];
          }
        ];
      };
      lessons: {
        Row: {
          id: string;
          unit_id: string;
          order: number;
          title: string;
          xp_reward: number;
          estimated_minutes: number;
          ai_teacher_prompt: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          unit_id: string;
          order: number;
          title: string;
          xp_reward?: number;
          estimated_minutes?: number;
          ai_teacher_prompt?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          order?: number;
          title?: string;
          xp_reward?: number;
          estimated_minutes?: number;
          ai_teacher_prompt?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedSchema: "public";
            referencedColumns: ["id"];
          }
        ];
      };
      vocabularies: {
        Row: {
          id: string;
          lesson_id: string;
          word: string;
          translation: string;
          pronunciation: string;
          example_sentence: string;
          example_translation: string;
          created_at: string;
        };
        Insert: {
          id: string;
          lesson_id: string;
          word: string;
          translation: string;
          pronunciation: string;
          example_sentence: string;
          example_translation: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          word?: string;
          translation?: string;
          pronunciation?: string;
          example_sentence?: string;
          example_translation?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vocabularies_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedSchema: "public";
            referencedColumns: ["id"];
          }
        ];
      };
      activities: {
        Row: {
          id: string;
          lesson_id: string;
          order: number;
          type: string;
          instruction: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          lesson_id: string;
          order: number;
          type: string;
          instruction: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          order?: number;
          type?: string;
          instruction?: string;
          data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedSchema: "public";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_active_language: {
        Args: {
          p_language_id: string;
        };
        Returns: void;
      };
      record_lesson_progress: {
        Args: {
          p_lesson_id: string;
          p_status: string;
          p_current_activity: number;
          p_xp_earned: number;
          p_minutes_practiced?: number;
        };
        Returns: void;
      };
      record_vocabulary_review: {
        Args: {
          p_vocabulary_id: string;
          p_lesson_id: string;
          p_status: string;
          p_is_correct: boolean;
          p_ease_factor: number;
          p_interval_days: number;
          p_due_at: string;
          p_minutes_practiced?: number;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type UserLanguage = Tables<'user_languages'>;
export type LessonProgress = Tables<'lesson_progress'>;
export type VocabularyProgress = Tables<'vocabulary_progress'>;
export type DailyActivity = Tables<'daily_activity'>;

export type LanguageRow = Tables<'languages'>;
export type UnitRow = Tables<'units'>;
export type LessonRow = Tables<'lessons'>;
export type VocabularyRow = Tables<'vocabularies'>;
export type ActivityRow = Tables<'activities'>;
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

