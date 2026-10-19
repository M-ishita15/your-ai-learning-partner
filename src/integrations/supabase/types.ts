export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          citations: Json
          content: string
          created_at: string
          grounded: boolean
          id: string
          lesson_id: string
          retrieved: Json
          role: string
          user_id: string
          watched_up_to_sec: number
        }
        Insert: {
          citations?: Json
          content: string
          created_at?: string
          grounded?: boolean
          id?: string
          lesson_id: string
          retrieved?: Json
          role: string
          user_id?: string
          watched_up_to_sec?: number
        }
        Update: {
          citations?: Json
          content?: string
          created_at?: string
          grounded?: boolean
          id?: string
          lesson_id?: string
          retrieved?: Json
          role?: string
          user_id?: string
          watched_up_to_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          duration_sec: number
          id: string
          note: string
          source: string
          summary: string
          title: string
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number
          id?: string
          note?: string
          source?: string
          summary?: string
          title: string
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          duration_sec?: number
          id?: string
          note?: string
          source?: string
          summary?: string
          title?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          correct: boolean
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          id?: string
          question_id: string
          user_id?: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer_index: number
          explanation: string
          id: string
          lesson_id: string
          options: Json
          question: string
          source_start_sec: number
          topic_marker_id: string | null
        }
        Insert: {
          answer_index: number
          explanation?: string
          id?: string
          lesson_id: string
          options: Json
          question: string
          source_start_sec?: number
          topic_marker_id?: string | null
        }
        Update: {
          answer_index?: number
          explanation?: string
          id?: string
          lesson_id?: string
          options?: Json
          question?: string
          source_start_sec?: number
          topic_marker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_topic_marker_id_fkey"
            columns: ["topic_marker_id"]
            isOneToOne: false
            referencedRelation: "topic_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_items: {
        Row: {
          due_at: string
          ease: number
          id: string
          interval_days: number
          last_result: string | null
          topic_marker_id: string
          user_id: string
        }
        Insert: {
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          last_result?: string | null
          topic_marker_id: string
          user_id?: string
        }
        Update: {
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          last_result?: string | null
          topic_marker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_items_topic_marker_id_fkey"
            columns: ["topic_marker_id"]
            isOneToOne: false
            referencedRelation: "topic_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_markers: {
        Row: {
          id: string
          lesson_id: string
          start_sec: number
          summary: string
          title: string
        }
        Insert: {
          id?: string
          lesson_id: string
          start_sec: number
          summary?: string
          title: string
        }
        Update: {
          id?: string
          lesson_id?: string
          start_sec?: number
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_markers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_chunks: {
        Row: {
          end_sec: number
          id: string
          lesson_id: string
          start_sec: number
          text: string
          tsv: unknown
        }
        Insert: {
          end_sec: number
          id?: string
          lesson_id: string
          start_sec: number
          text: string
          tsv?: unknown
        }
        Update: {
          end_sec?: number
          id?: string
          lesson_id?: string
          start_sec?: number
          text?: string
          tsv?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "transcript_chunks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          lesson_id: string
          max_watched_sec: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lesson_id: string
          max_watched_sec?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          lesson_id?: string
          max_watched_sec?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_chunks: {
        Args: {
          _lesson: string
          _limit?: number
          _query: string
          _upto: number
        }
        Returns: {
          end_sec: number
          id: string
          rank: number
          start_sec: number
          text: string
        }[]
      }
      match_later: {
        Args: { _lesson: string; _query: string; _upto: number }
        Returns: {
          start_sec: number
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
